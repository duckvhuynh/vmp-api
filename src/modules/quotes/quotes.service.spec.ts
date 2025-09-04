import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuotesService } from './quotes.service';
import { Quote } from './schemas/quote.schema';
import { PriceCalculationService } from '../pricing/services/price-calculation.service';
import { PriceRegionService } from '../pricing/services/price-region.service';
import { VehiclesService } from '../vehicles/services/vehicles.service';
import { VehicleClass } from '../pricing/schemas/base-price.schema';
import { BadRequestException } from '@nestjs/common';

describe('QuotesService', () => {
  let service: QuotesService;
  let quoteModel: Model<Quote>;
  let priceCalculationService: PriceCalculationService;
  let priceRegionService: PriceRegionService;

  const mockQuoteModel = {
    constructor: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPriceCalculationService = {
    calculatePrice: jest.fn(),
  };

  const mockPriceRegionService = {
    findOne: jest.fn(),
    findByLocation: jest.fn(),
  };

  const mockVehiclesService = {
    // Add mock methods as needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: getModelToken(Quote.name),
          useValue: mockQuoteModel,
        },
        {
          provide: PriceCalculationService,
          useValue: mockPriceCalculationService,
        },
        {
          provide: PriceRegionService,
          useValue: mockPriceRegionService,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    quoteModel = module.get<Model<Quote>>(getModelToken(Quote.name));
    priceCalculationService = module.get<PriceCalculationService>(PriceCalculationService);
    priceRegionService = module.get<PriceRegionService>(PriceRegionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createQuoteDto = {
      origin: {
        type: 'airport' as const,
        airportCode: 'DXB',
        latitude: 25.2532,
        longitude: 55.3644,
      },
      destination: {
        type: 'address' as const,
        address: 'Downtown Dubai',
        latitude: 25.1972,
        longitude: 55.2744,
      },
      pickupAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      pax: 2,
      bags: 1,
    };

    it('should reject quotes for past pickup times', async () => {
      const pastDto = {
        ...createQuoteDto,
        pickupAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };

      await expect(service.create(pastDto)).rejects.toThrow(BadRequestException);
    });

    it('should create a quote successfully', async () => {
      const mockRegion = { _id: 'region1', name: 'Dubai Airport' };
      const mockPriceBreakdown = {
        baseFare: 25,
        distanceCharge: 12.5,
        timeCharge: 8,
        extrasTotal: 0,
        appliedSurcharges: [],
        totalSurcharges: 0,
        subtotal: 45.5,
        total: 45.5,
        currency: 'AED',
        pricingMethod: 'distance_based',
        isFixedPrice: false,
      };

      mockPriceRegionService.findByLocation.mockResolvedValue([mockRegion]);
      mockPriceCalculationService.calculatePrice.mockResolvedValue(mockPriceBreakdown);

      const mockQuoteInstance = {
        save: jest.fn().mockResolvedValue(true),
        quoteId: 'test-quote-id',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };
      
      // Mock the constructor to return our mock instance
      jest.spyOn(quoteModel, 'constructor' as any).mockImplementation(() => mockQuoteInstance);

      const result = await service.create(createQuoteDto);

      expect(result).toBeDefined();
      expect(result.quoteId).toBeDefined();
      expect(result.vehicleClasses).toHaveLength(1);
      expect(result.vehicleClasses[0].pricing.total).toBe(45.5);
      expect(mockQuoteInstance.save).toHaveBeenCalled();
    });

    it('should throw error when no regions cover the origin', async () => {
      mockPriceRegionService.findByLocation.mockResolvedValue([]);

      await expect(service.create(createQuoteDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle pricing calculation errors gracefully', async () => {
      const mockRegion = { _id: 'region1', name: 'Dubai Airport' };
      mockPriceRegionService.findByLocation.mockResolvedValue([mockRegion]);
      mockPriceCalculationService.calculatePrice.mockRejectedValue(new Error('Pricing error'));

      await expect(service.create(createQuoteDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should retrieve an existing quote', async () => {
      const mockQuote = {
        quoteId: 'test-quote-id',
        expiresAt: new Date(Date.now() + 3600000), // Valid quote
        pickupAt: new Date(),
        createdAt: new Date(),
        vehicleOptions: [{
          vehicleClass: VehicleClass.ECONOMY,
          name: 'Economy',
          paxCapacity: 3,
          bagCapacity: 2,
          pricing: {
            baseFare: 25,
            total: 45.5,
            currency: 'AED',
          },
        }],
        policy: {
          cancellation: 'Free until 24h',
          includedWait: '15 minutes',
        },
      };

      mockQuoteModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuote),
      });

      const result = await service.findOne('test-quote-id');

      expect(result).toBeDefined();
      expect(result.quoteId).toBe('test-quote-id');
    });

    it('should throw NotFoundException for non-existent quote', async () => {
      mockQuoteModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('non-existent')).rejects.toThrow('Quote non-existent not found');
    });

    it('should throw BadRequestException for expired quote', async () => {
      const expiredQuote = {
        quoteId: 'expired-quote',
        expiresAt: new Date(Date.now() - 3600000), // Expired quote
      };

      mockQuoteModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredQuote),
      });

      await expect(service.findOne('expired-quote')).rejects.toThrow('Quote expired-quote has expired');
    });
  });
});
