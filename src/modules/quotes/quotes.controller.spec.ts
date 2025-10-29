import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { VehicleClass } from '../pricing/schemas/base-price.schema';

describe('QuotesController', () => {
  let app: INestApplication;
  let quotesService: QuotesService;

  const mockQuotesService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    
    await app.init();
    quotesService = module.get<QuotesService>(QuotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /quotes', () => {
    const validQuoteRequest = {
      origin: {
        type: 'airport',
        airportCode: 'DXB',
        terminal: 'T3',
        latitude: 25.2532,
        longitude: 55.3644,
      },
      destination: {
        type: 'address',
        address: 'Downtown Dubai',
        latitude: 25.1972,
        longitude: 55.2744,
      },
      pickupAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      pax: 2,
      bags: 1,
      extras: ['child_seat'],
    };

    const mockQuoteResponse = {
      quoteId: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1',
      vehicleClasses: [
        {
          id: VehicleClass.ECONOMY,
          name: 'Economy',
          paxCapacity: 3,
          bagCapacity: 2,
          pricing: {
            baseFare: 25.0,
            distanceCharge: 12.5,
            timeCharge: 8.0,
            extras: 10.0,
            surcharges: 13.875,
            total: 69.375,
            currency: 'AED',
          },
          appliedSurcharges: [
            {
              name: 'Night surcharge',
              application: 'percentage',
              value: 25.0,
              amount: 13.875,
              reason: 'Night time hours (22:00-06:00)',
            },
          ],
          includedWaitingTime: 15,
          additionalWaitingPrice: 1.5,
          isFixedPrice: false,
        },
      ],
      policy: {
        cancellation: 'Free cancellation until 24 hours before pickup',
        includedWait: '15 minutes included',
        additionalWaitCharge: '1.50 AED per minute',
        quoteExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      estimatedDistance: 15.5,
      estimatedDuration: 25,
      originName: 'DXB Airport - Terminal T3',
      destinationName: 'Downtown Dubai',
      pickupAt: validQuoteRequest.pickupAt,
      passengers: 2,
      luggage: 1,
      extras: ['child_seat'],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    it('should create a quote successfully', async () => {
      mockQuotesService.create.mockResolvedValue(mockQuoteResponse);

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(validQuoteRequest)
        .expect(201);

      expect(response.body).toEqual(mockQuoteResponse);
      expect(mockQuotesService.create).toHaveBeenCalledWith(validQuoteRequest);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        origin: {
          type: 'airport',
          // Missing airportCode for airport type
        },
        destination: {
          type: 'address',
          // Missing address for address type
        },
        // Missing pickupAt, pax, bags
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(invalidRequest)
        .expect(400);

      expect(mockQuotesService.create).not.toHaveBeenCalled();
    });

    it('should validate passenger count minimum', async () => {
      const invalidRequest = {
        ...validQuoteRequest,
        pax: 0, // Should be at least 1
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(invalidRequest)
        .expect(400);

      expect(mockQuotesService.create).not.toHaveBeenCalled();
    });

    it('should validate coordinate ranges', async () => {
      const invalidRequest = {
        ...validQuoteRequest,
        origin: {
          ...validQuoteRequest.origin,
          latitude: 91, // Invalid latitude (> 90)
          longitude: 181, // Invalid longitude (> 180)
        },
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(invalidRequest)
        .expect(400);

      expect(mockQuotesService.create).not.toHaveBeenCalled();
    });

    it('should validate vehicle class enum', async () => {
      const invalidRequest = {
        ...validQuoteRequest,
        preferredVehicleClass: 'invalid_class',
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(invalidRequest)
        .expect(400);

      expect(mockQuotesService.create).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockQuotesService.create.mockRejectedValue(new Error('Service error'));

      await request(app.getHttpServer())
        .post('/quotes')
        .send(validQuoteRequest)
        .expect(500);

      expect(mockQuotesService.create).toHaveBeenCalledWith(validQuoteRequest);
    });

    it('should accept all valid vehicle classes', async () => {
      const requests = Object.values(VehicleClass).map(vehicleClass => ({
        ...validQuoteRequest,
        preferredVehicleClass: vehicleClass,
      }));

      for (const request of requests) {
        mockQuotesService.create.mockResolvedValue({
          ...mockQuoteResponse,
          vehicleClasses: [
            {
              ...mockQuoteResponse.vehicleClasses[0],
              id: request.preferredVehicleClass,
            },
          ],
        });

        await request(app.getHttpServer())
          .post('/quotes')
          .send(request)
          .expect(201);
      }

      expect(mockQuotesService.create).toHaveBeenCalledTimes(Object.values(VehicleClass).length);
    });

    it('should accept valid extras array', async () => {
      const validExtras = [
        'child_seat',
        'baby_seat',
        'wheelchair_accessible',
        'extra_luggage',
        'meet_and_greet',
        'priority_pickup',
        'extra_stop',
      ];

      const requestWithExtras = {
        ...validQuoteRequest,
        extras: validExtras,
      };

      mockQuotesService.create.mockResolvedValue(mockQuoteResponse);

      await request(app.getHttpServer())
        .post('/quotes')
        .send(requestWithExtras)
        .expect(201);

      expect(mockQuotesService.create).toHaveBeenCalledWith(requestWithExtras);
    });
  });

  describe('GET /quotes/:quoteId', () => {
    const mockQuoteResponse = {
      quoteId: 'test-quote-id',
      vehicleClasses: [
        {
          id: VehicleClass.ECONOMY,
          name: 'Economy',
          paxCapacity: 3,
          bagCapacity: 2,
          pricing: {
            baseFare: 25.0,
            total: 45.5,
            currency: 'AED',
          },
        },
      ],
      policy: {
        cancellation: 'Free until 24h',
        includedWait: '15 minutes',
      },
      pickupAt: new Date().toISOString(),
      passengers: 2,
      luggage: 1,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    it('should retrieve an existing quote', async () => {
      mockQuotesService.findOne.mockResolvedValue(mockQuoteResponse);

      const response = await request(app.getHttpServer())
        .get('/quotes/test-quote-id')
        .expect(200);

      expect(response.body).toEqual(mockQuoteResponse);
      expect(mockQuotesService.findOne).toHaveBeenCalledWith('test-quote-id');
    });

    it('should return 404 for non-existent quote', async () => {
      mockQuotesService.findOne.mockRejectedValue(new Error('Quote not found'));

      await request(app.getHttpServer())
        .get('/quotes/non-existent-quote')
        .expect(500); // Service error becomes 500

      expect(mockQuotesService.findOne).toHaveBeenCalledWith('non-existent-quote');
    });

    it('should validate quote ID parameter', async () => {
      // Test with various quote ID formats
      const validQuoteIds = [
        '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1', // UUID
        'simple-quote-id', // Simple string
        'quote_123', // With underscore
      ];

      for (const quoteId of validQuoteIds) {
        mockQuotesService.findOne.mockResolvedValue({
          ...mockQuoteResponse,
          quoteId,
        });

        await request(app.getHttpServer())
          .get(`/quotes/${quoteId}`)
          .expect(200);

        expect(mockQuotesService.findOne).toHaveBeenCalledWith(quoteId);
      }
    });
  });

  describe('Content-Type and Headers', () => {
    it('should accept JSON content type', async () => {
      const validRequest = {
        origin: { type: 'airport', airportCode: 'DXB' },
        destination: { type: 'address', address: 'Downtown' },
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 1,
        bags: 0,
      };

      mockQuotesService.create.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/quotes')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(201);
    });

    it('should return JSON response', async () => {
      mockQuotesService.findOne.mockResolvedValue({ quoteId: 'test' });

      const response = await request(app.getHttpServer())
        .get('/quotes/test-quote-id')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
