//@ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PriceCalculationService } from './services/price-calculation.service';
import { PriceRegionService } from './services/price-region.service';
import { BasePriceService } from './services/base-price.service';
import { SurchargeService } from './services/surcharge.service';
import { FixedPriceService } from './services/fixed-price.service';
import { VehicleClass } from './schemas/base-price.schema';
import { RegionShapeType } from './schemas/price-region.schema';
import { SurchargeType, SurchargeApplication } from './schemas/surcharge.schema';

describe('PriceCalculationService', () => {
  let service: PriceCalculationService;
  let priceRegionService: PriceRegionService;
  let basePriceService: BasePriceService;
  let surchargeService: SurchargeService;
  let fixedPriceService: FixedPriceService;

  // Mock data
  const mockPriceRegion = {
    _id: '64f7b1234567890123456789',
    name: 'Dubai International Airport',
    tags: ['airport', 'dubai'],
    shape: {
      type: RegionShapeType.CIRCLE,
      center: [55.3644, 25.2532],
      radius: 3000,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBasePrice = {
    _id: '64f7b1234567890123456790',
    regionId: '64f7b1234567890123456789',
    vehicleClass: VehicleClass.ECONOMY,
    baseFare: 20.0,
    pricePerKm: 2.5,
    pricePerMinute: 0.8,
    minimumFare: 25.0,
    currency: 'AED',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSurcharge = {
    _id: '64f7b1234567890123456791',
    regionId: '64f7b1234567890123456789',
    name: 'Night Surcharge',
    type: SurchargeType.DATETIME,
    application: SurchargeApplication.PERCENTAGE,
    value: 25.0,
    timeRange: {
      startTime: '22:00',
      endTime: '06:00',
    },
    isActive: true,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModels = {
    PriceRegion: {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    },
    BasePrice: {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    },
    Surcharge: {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    },
    FixedPrice: {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceCalculationService,
        PriceRegionService,
        BasePriceService,
        SurchargeService,
        FixedPriceService,
        {
          provide: getModelToken('PriceRegion'),
          useValue: mockModels.PriceRegion,
        },
        {
          provide: getModelToken('BasePrice'),
          useValue: mockModels.BasePrice,
        },
        {
          provide: getModelToken('Surcharge'),
          useValue: mockModels.Surcharge,
        },
        {
          provide: getModelToken('FixedPrice'),
          useValue: mockModels.FixedPrice,
        },
      ],
    }).compile();

    service = module.get<PriceCalculationService>(PriceCalculationService);
    priceRegionService = module.get<PriceRegionService>(PriceRegionService);
    basePriceService = module.get<BasePriceService>(BasePriceService);
    surchargeService = module.get<SurchargeService>(SurchargeService);
    fixedPriceService = module.get<FixedPriceService>(FixedPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePrice', () => {
    it('should calculate distance-based price correctly', async () => {
      // Mock service responses
      jest.spyOn(priceRegionService, 'findByLocation').mockResolvedValue([mockPriceRegion]);
      jest.spyOn(fixedPriceService, 'findByRoute').mockResolvedValue(null);
      jest.spyOn(basePriceService, 'findByRegionAndVehicleClass').mockResolvedValue(mockBasePrice);
      jest.spyOn(surchargeService, 'findApplicableSurcharges').mockResolvedValue([]);

      const request = {
        originLatitude: 25.2532,
        originLongitude: 55.3644,
        vehicleClass: VehicleClass.ECONOMY,
        distanceKm: 10,
        durationMinutes: 20,
        bookingDateTime: new Date('2024-01-15T14:00:00Z'),
      };

      const result = await service.calculatePrice(request);

      expect(result.pricingMethod).toBe('distance_based');
      expect(result.baseFare).toBe(20.0);
      expect(result.distanceFare).toBe(25.0); // 10km * 2.5
      expect(result.timeFare).toBe(16.0); // 20min * 0.8
      expect(result.subtotal).toBe(61.0); // baseFare + distanceFare + timeFare
      expect(result.total).toBe(61.0); // No surcharges
      expect(result.currency).toBe('AED');
    });

    it('should apply minimum fare when calculated fare is too low', async () => {
      jest.spyOn(priceRegionService, 'findByLocation').mockResolvedValue([mockPriceRegion]);
      jest.spyOn(fixedPriceService, 'findByRoute').mockResolvedValue(null);
      jest.spyOn(basePriceService, 'findByRegionAndVehicleClass').mockResolvedValue(mockBasePrice);
      jest.spyOn(surchargeService, 'findApplicableSurcharges').mockResolvedValue([]);

      const request = {
        originLatitude: 25.2532,
        originLongitude: 55.3644,
        vehicleClass: VehicleClass.ECONOMY,
        distanceKm: 1,
        durationMinutes: 2,
        bookingDateTime: new Date('2024-01-15T14:00:00Z'),
      };

      const result = await service.calculatePrice(request);

      expect(result.subtotal).toBe(25.0); // Minimum fare applied
      expect(result.total).toBe(25.0);
    });

    it('should apply surcharges correctly', async () => {
      jest.spyOn(priceRegionService, 'findByLocation').mockResolvedValue([mockPriceRegion]);
      jest.spyOn(fixedPriceService, 'findByRoute').mockResolvedValue(null);
      jest.spyOn(basePriceService, 'findByRegionAndVehicleClass').mockResolvedValue(mockBasePrice);
      jest.spyOn(surchargeService, 'findApplicableSurcharges').mockResolvedValue([mockSurcharge]);

      const request = {
        originLatitude: 25.2532,
        originLongitude: 55.3644,
        vehicleClass: VehicleClass.ECONOMY,
        distanceKm: 10,
        durationMinutes: 20,
        bookingDateTime: new Date('2024-01-15T23:00:00Z'), // Night time
      };

      const result = await service.calculatePrice(request);

      expect(result.subtotal).toBe(61.0);
      expect(result.surcharges).toHaveLength(1);
      expect(result.surcharges[0].appliedAmount).toBe(15.25); // 25% of 61.0
      expect(result.totalSurcharges).toBe(15.25);
      expect(result.total).toBe(76.25); // 61.0 + 15.25
    });
  });
});

/*
Example Usage:

1. Create a price region for Dubai Airport:
POST /api/v1/price-regions
{
  "name": "Dubai International Airport",
  "tags": ["airport", "dubai"],
  "shape": {
    "type": "circle",
    "center": [55.3644, 25.2532],
    "radius": 3000
  },
  "description": "Main Dubai airport region"
}

2. Set base prices for different vehicle classes:
POST /api/v1/base-prices
{
  "regionId": "64f7b1234567890123456789",
  "vehicleClass": "economy",
  "baseFare": 20.0,
  "pricePerKm": 2.5,
  "pricePerMinute": 0.8,
  "minimumFare": 25.0,
  "currency": "AED"
}

3. Add a night surcharge:
POST /api/v1/surcharges
{
  "regionId": "64f7b1234567890123456789",
  "name": "Night Surcharge",
  "type": "datetime",
  "application": "percentage",
  "value": 25.0,
  "timeRange": {
    "startTime": "22:00",
    "endTime": "06:00"
  },
  "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
}

4. Add a fixed price route:
POST /api/v1/fixed-prices
{
  "originRegionId": "64f7b1234567890123456789",
  "destinationRegionId": "64f7b1234567890123456790",
  "name": "Airport to Downtown Dubai",
  "vehicleClass": "economy",
  "fixedPrice": 85.0,
  "currency": "AED",
  "estimatedDistance": 25.5,
  "estimatedDuration": 35,
  "includedWaitingTime": 15,
  "additionalWaitingPrice": 1.5
}

5. Query applicable surcharges:
GET /api/v1/surcharges/applicable?regionId=64f7b1234567890123456789&bookingDateTime=2024-01-15T23:00:00Z&minutesUntilPickup=30

6. Find regions by location:
GET /api/v1/price-regions/by-location?longitude=55.3644&latitude=25.2532

7. Get fixed price for route:
GET /api/v1/fixed-prices/by-route?originRegionId=64f7b1234567890123456789&destinationRegionId=64f7b1234567890123456790&vehicleClass=economy
*/
