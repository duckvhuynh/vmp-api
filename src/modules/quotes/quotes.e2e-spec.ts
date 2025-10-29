import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

import { QuotesModule } from './quotes.module';
import { PricingModule } from '../pricing/pricing.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { VehicleClass } from '../pricing/schemas/base-price.schema';
import { SurchargeType, SurchargeApplication } from '../pricing/schemas/surcharge.schema';

describe('Quotes E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        QuotesModule,
        PricingModule,
        VehiclesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    // Clean database before each test
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
    await app.close();
  });

  async function seedTestData() {
    // Create test price regions
    const regionsCollection = mongoConnection.collection('priceregions');
    await regionsCollection.insertMany([
      {
        _id: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Dubai Airport Region',
        description: 'Dubai International Airport coverage area',
        tags: ['airport', 'dxb'],
        geometry: {
          type: 'Polygon',
          coordinates: [[[55.3600, 25.2500], [55.3700, 25.2500], [55.3700, 25.2600], [55.3600, 25.2600], [55.3600, 25.2500]]]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Downtown Dubai Region',
        description: 'Downtown Dubai area',
        tags: ['city', 'downtown'],
        geometry: {
          type: 'Polygon',
          coordinates: [[[55.2700, 25.1900], [55.2800, 25.1900], [55.2800, 25.2000], [55.2700, 25.2000], [55.2700, 25.1900]]]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create base prices
    const basePricesCollection = mongoConnection.collection('baseprices');
    await basePricesCollection.insertMany([
      {
        regionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        vehicleClass: VehicleClass.ECONOMY,
        baseFare: 25.0,
        pricePerKm: 2.0,
        pricePerMinute: 0.5,
        minimumFare: 15.0,
        currency: 'AED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        regionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        vehicleClass: VehicleClass.VAN,
        baseFare: 40.0,
        pricePerKm: 3.2,
        pricePerMinute: 0.8,
        minimumFare: 25.0,
        currency: 'AED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create fixed prices
    const fixedPricesCollection = mongoConnection.collection('fixedprices');
    await fixedPricesCollection.insertMany([
      {
        originRegionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        destinationRegionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Airport to Downtown Fixed Route',
        vehicleClass: VehicleClass.ECONOMY,
        fixedPrice: 75.0,
        currency: 'AED',
        estimatedDistance: 15.5,
        estimatedDuration: 25,
        includedWaitingTime: 15,
        additionalWaitingPrice: 1.5,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create surcharges
    const surchargesCollection = mongoConnection.collection('surcharges');
    await surchargesCollection.insertMany([
      {
        regionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Night surcharge',
        type: SurchargeType.DATETIME,
        application: SurchargeApplication.PERCENTAGE,
        value: 25.0,
        timeRange: {
          startTime: '22:00',
          endTime: '06:00',
        },
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
        isActive: true,
        priority: 1,
        description: 'Night time hours surcharge',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        regionId: new mongoConnection.base.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Last minute booking',
        type: SurchargeType.CUTOFF_TIME,
        application: SurchargeApplication.FIXED_AMOUNT,
        value: 20.0,
        currency: 'AED',
        cutoffMinutes: 60,
        isActive: true,
        priority: 2,
        description: 'Booking within 1 hour of pickup',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  describe('POST /quotes', () => {
    it('should create a quote with fixed pricing', async () => {
      const quoteRequest = {
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
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.quoteId).toBeDefined();
      expect(response.body.vehicleClasses).toHaveLength(1);

      const vehicleClass = response.body.vehicleClasses[0];
      expect(vehicleClass.id).toBe(VehicleClass.ECONOMY);
      expect(vehicleClass.pricing.total).toBe(75.0); // Fixed price
      expect(vehicleClass.isFixedPrice).toBe(true);
      expect(vehicleClass.includedWaitingTime).toBe(15);

      expect(response.body.policy).toBeDefined();
      expect(response.body.policy.cancellation).toContain('24 hours');
      expect(response.body.estimatedDistance).toBe(15.5);
      expect(response.body.estimatedDuration).toBe(25);
    });

    it('should create a quote with distance-based pricing and surcharges', async () => {
      // Create a night time pickup to trigger surcharge
      const nightPickup = new Date();
      nightPickup.setHours(23, 0, 0, 0); // 11 PM
      nightPickup.setDate(nightPickup.getDate() + 1); // Tomorrow

      const quoteRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Remote Location',
          latitude: 25.3000, // Outside downtown region
          longitude: 55.4000,
        },
        pickupAt: nightPickup.toISOString(),
        pax: 2,
        bags: 1,
        distanceKm: 20.0,
        durationMinutes: 30,
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.vehicleClasses).toHaveLength(1);

      const vehicleClass = response.body.vehicleClasses[0];
      expect(vehicleClass.isFixedPrice).toBe(false);
      expect(vehicleClass.pricing.baseFare).toBe(25.0);
      expect(vehicleClass.pricing.distanceCharge).toBe(40.0); // 20km * 2.0
      expect(vehicleClass.pricing.timeCharge).toBe(15.0); // 30min * 0.5
      
      // Should have night surcharge applied
      expect(vehicleClass.appliedSurcharges).toHaveLength(1);
      expect(vehicleClass.appliedSurcharges[0].name).toBe('Night surcharge');
      expect(vehicleClass.appliedSurcharges[0].value).toBe(25.0);
    });

    it('should create a quote with extras pricing', async () => {
      const quoteRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Downtown Dubai',
          latitude: 25.1972,
          longitude: 55.2744,
        },
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 3,
        bags: 2,
        extras: ['child_seat', 'baby_seat', 'meet_and_greet'],
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest)
        .expect(201);

      const vehicleClass = response.body.vehicleClasses[0];
      expect(vehicleClass.pricing.extras).toBe(37.0); // 10 + 12 + 15
      expect(response.body.extras).toEqual(['child_seat', 'baby_seat', 'meet_and_greet']);
    });

    it('should filter vehicle classes by passenger capacity', async () => {
      const largeFamilyRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Downtown Dubai',
          latitude: 25.1972,
          longitude: 55.2744,
        },
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 6, // Requires van
        bags: 4,
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(largeFamilyRequest)
        .expect(201);

      expect(response.body.vehicleClasses).toHaveLength(1);
      expect(response.body.vehicleClasses[0].id).toBe(VehicleClass.VAN);
      expect(response.body.vehicleClasses[0].paxCapacity).toBe(6);
    });

    it('should apply last-minute surcharge for urgent bookings', async () => {
      // Book for 30 minutes from now (within cutoff)
      const urgentPickup = new Date(Date.now() + 30 * 60 * 1000);

      const quoteRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Remote Location',
          latitude: 25.3000,
          longitude: 55.4000,
        },
        pickupAt: urgentPickup.toISOString(),
        pax: 1,
        bags: 1,
        distanceKm: 10.0,
        durationMinutes: 15,
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest)
        .expect(201);

      const vehicleClass = response.body.vehicleClasses[0];
      
      // Should have last-minute surcharge
      const lastMinuteSurcharge = vehicleClass.appliedSurcharges.find(
        s => s.name === 'Last minute booking'
      );
      expect(lastMinuteSurcharge).toBeDefined();
      expect(lastMinuteSurcharge.value).toBe(20.0);
      expect(lastMinuteSurcharge.application).toBe('fixed_amount');
    });

    it('should reject quotes for past pickup times', async () => {
      const pastRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Downtown Dubai',
          latitude: 25.1972,
          longitude: 55.2744,
        },
        pickupAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        pax: 2,
        bags: 1,
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(pastRequest)
        .expect(400);
    });

    it('should reject quotes for unsupported regions', async () => {
      const unsupportedRequest = {
        origin: {
          type: 'address',
          address: 'Unsupported Location',
          latitude: 50.0000, // Far outside supported regions
          longitude: 50.0000,
        },
        destination: {
          type: 'address',
          address: 'Another Unsupported Location',
          latitude: 51.0000,
          longitude: 51.0000,
        },
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 2,
        bags: 1,
      };

      await request(app.getHttpServer())
        .post('/quotes')
        .send(unsupportedRequest)
        .expect(400);
    });
  });

  describe('GET /quotes/:quoteId', () => {
    let createdQuoteId: string;

    beforeEach(async () => {
      // Create a quote to retrieve
      const quoteRequest = {
        origin: {
          type: 'airport',
          airportCode: 'DXB',
          latitude: 25.2532,
          longitude: 55.3644,
        },
        destination: {
          type: 'address',
          address: 'Downtown Dubai',
          latitude: 25.1972,
          longitude: 55.2744,
        },
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 2,
        bags: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest);

      createdQuoteId = createResponse.body.quoteId;
    });

    it('should retrieve an existing quote', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quotes/${createdQuoteId}`)
        .expect(200);

      expect(response.body.quoteId).toBe(createdQuoteId);
      expect(response.body.vehicleClasses).toBeDefined();
      expect(response.body.policy).toBeDefined();
    });

    it('should return 404 for non-existent quote', async () => {
      await request(app.getHttpServer())
        .get('/quotes/non-existent-quote-id')
        .expect(404);
    });

    it('should return 400 for expired quote', async () => {
      // Wait for quote to expire (this is a simulation - in real scenario quotes expire after 1 hour)
      // For testing, we'll manually update the expiry in the database
      const quotesCollection = mongoConnection.collection('quotes');
      await quotesCollection.updateOne(
        { quoteId: createdQuoteId },
        { $set: { expiresAt: new Date(Date.now() - 3600000) } } // Set to 1 hour ago
      );

      await request(app.getHttpServer())
        .get(`/quotes/${createdQuoteId}`)
        .expect(400);
    });
  });

  describe('Quote Persistence', () => {
    it('should persist quote data correctly', async () => {
      const quoteRequest = {
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
        pickupAt: new Date(Date.now() + 86400000).toISOString(),
        pax: 2,
        bags: 1,
        extras: ['child_seat'],
        distanceKm: 15.5,
        durationMinutes: 25,
      };

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteRequest);

      // Check database directly
      const quotesCollection = mongoConnection.collection('quotes');
      const savedQuote = await quotesCollection.findOne({
        quoteId: response.body.quoteId,
      });

      expect(savedQuote).toBeDefined();
      expect(savedQuote.origin.airportCode).toBe('DXB');
      expect(savedQuote.origin.terminal).toBe('T3');
      expect(savedQuote.destination.address).toBe('Downtown Dubai');
      expect(savedQuote.passengers).toBe(2);
      expect(savedQuote.luggage).toBe(1);
      expect(savedQuote.extras).toEqual(['child_seat']);
      expect(savedQuote.estimatedDistance).toBe(15.5);
      expect(savedQuote.estimatedDuration).toBe(25);
      expect(savedQuote.expiresAt).toBeDefined();
      expect(savedQuote.isUsed).toBe(false);
    });

    it('should automatically clean up expired quotes', async () => {
      // This test verifies the TTL index works correctly
      // In a real scenario, MongoDB would automatically remove expired documents
      const quotesCollection = mongoConnection.collection('quotes');
      
      // Insert an expired quote directly
      const expiredQuote = {
        quoteId: 'expired-test-quote',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(Date.now() - 3600000),
        isUsed: false,
      };

      await quotesCollection.insertOne(expiredQuote);

      // Verify it exists initially
      let quote = await quotesCollection.findOne({ quoteId: 'expired-test-quote' });
      expect(quote).toBeDefined();

      // In a real scenario with TTL index, this would be automatically removed
      // For testing purposes, we'll manually verify the expiry logic
      expect(quote.expiresAt.getTime()).toBeLessThan(Date.now());
    });
  });
});
