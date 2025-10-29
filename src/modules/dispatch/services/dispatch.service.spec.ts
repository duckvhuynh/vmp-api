import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DispatchService } from './dispatch.service';
import { Driver, DriverStatus, DriverAvailability } from '../../drivers/schemas/driver.schema';
import { Booking, BookingStatus } from '../../bookings/schemas/booking.schema';
import { BadRequestException } from '@nestjs/common';

describe('DispatchService', () => {
  let service: DispatchService;
  let driverModel: Model<Driver>;
  let bookingModel: Model<Booking>;

  const mockDriverModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
    driverId: 'test-driver-id',
    status: DriverStatus.ONLINE,
    availability: DriverAvailability.AVAILABLE,
  }));
  
  Object.assign(mockDriverModel, {
    findOne: jest.fn(),
    find: jest.fn(),
  });

  const mockBookingModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
    bookingId: 'test-booking-id',
    status: BookingStatus.CONFIRMED,
    events: [],
  }));
  
  Object.assign(mockBookingModel, {
    findOne: jest.fn(),
    find: jest.fn(),
  });

  const mockDriver = {
    _id: '507f1f77bcf86cd799439011',
    driverId: 'test-driver-id',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+971501234567',
    status: DriverStatus.ONLINE,
    availability: DriverAvailability.AVAILABLE,
    currentLocation: {
      latitude: 25.2532,
      longitude: 55.3644,
      address: 'Dubai Airport',
    },
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      color: 'White',
      licensePlate: 'ABC-1234',
      type: 'sedan',
    },
    stats: {
      rating: 4.8,
    },
    isActive: true,
    isVerified: true,
    lastActiveAt: new Date(),
  };

  const mockBooking = {
    _id: '507f1f77bcf86cd799439022',
    bookingId: 'test-booking-id',
    status: BookingStatus.CONFIRMED,
    events: [],
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        {
          provide: getModelToken(Driver.name),
          useValue: mockDriverModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<DispatchService>(DispatchService);
    driverModel = module.get<Model<Driver>>(getModelToken(Driver.name));
    bookingModel = module.get<Model<Booking>>(getModelToken(Booking.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignDriver', () => {
    it('should assign driver successfully', async () => {
      const mockBookingInstance = { ...mockBooking };
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      (mockDriverModel as any).find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockDriverInstance]),
      });

      const assignRequest = {
        bookingId: 'test-booking-id',
        vehicleClass: 'sedan',
        pickupLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
        pickupTime: new Date(Date.now() + 3600000),
        radiusKm: 10,
        maxDriversToNotify: 5,
      };

      const result = await service.assignDriver(assignRequest);

      expect(result.success).toBe(true);
      expect(result.assignedDriverId).toBe('test-driver-id');
      expect(result.driverName).toBe('John Doe');
      expect(result.driverPhone).toBe('+971501234567');
      expect(result.message).toBe('Driver assigned successfully');
      expect(result.notifiedDrivers).toBe(1);

      expect(mockBookingInstance.status).toBe(BookingStatus.DRIVER_ASSIGNED);
      expect(mockBookingInstance.driver).toBeDefined();
      expect(mockBookingInstance.events).toHaveLength(1);
      expect(mockBookingInstance.events[0].event).toBe('driver_assigned');
      expect(mockDriverInstance.currentBookingId).toBe(mockBookingInstance._id);
    });

    it('should return failure when no available drivers', async () => {
      const mockBookingInstance = { ...mockBooking };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      (mockDriverModel as any).find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const assignRequest = {
        bookingId: 'test-booking-id',
        vehicleClass: 'sedan',
        pickupLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
        pickupTime: new Date(Date.now() + 3600000),
      };

      const result = await service.assignDriver(assignRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No available drivers found in the area');
      expect(result.notifiedDrivers).toBe(0);
    });

    it('should throw BadRequestException for non-existent booking', async () => {
      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const assignRequest = {
        bookingId: 'non-existent-booking',
        vehicleClass: 'sedan',
        pickupLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
        pickupTime: new Date(Date.now() + 3600000),
      };

      await expect(service.assignDriver(assignRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for booking in wrong status', async () => {
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.DRIVER_ASSIGNED 
      };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const assignRequest = {
        bookingId: 'test-booking-id',
        vehicleClass: 'sedan',
        pickupLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
        pickupTime: new Date(Date.now() + 3600000),
      };

      await expect(service.assignDriver(assignRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if driver already assigned', async () => {
      const mockBookingInstance = { 
        ...mockBooking, 
        driver: { driverId: 'existing-driver-id' }
      };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const assignRequest = {
        bookingId: 'test-booking-id',
        vehicleClass: 'sedan',
        pickupLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
        pickupTime: new Date(Date.now() + 3600000),
      };

      await expect(service.assignDriver(assignRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassignDriver', () => {
    it('should reassign driver successfully', async () => {
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.DRIVER_DECLINED,
        driver: { driverId: 'old-driver-id' }
      };
      const mockNewDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      const mockOldDriverInstance = { 
        ...mockDriver, 
        driverId: 'old-driver-id',
        save: jest.fn().mockResolvedValue(true) 
      };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      (mockDriverModel as any).findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockNewDriverInstance),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockOldDriverInstance),
        });

      const result = await service.reassignDriver('test-booking-id', 'test-driver-id');

      expect(result.success).toBe(true);
      expect(result.assignedDriverId).toBe('test-driver-id');
      expect(result.driverName).toBe('John Doe');
      expect(result.message).toBe('Driver reassigned successfully');

      expect(mockBookingInstance.status).toBe(BookingStatus.DRIVER_ASSIGNED);
      expect(mockBookingInstance.driver.driverId).toBe(mockNewDriverInstance._id);
      expect(mockBookingInstance.events).toHaveLength(1);
      expect(mockBookingInstance.events[0].event).toBe('driver_reassigned');
      expect(mockNewDriverInstance.currentBookingId).toBe(mockBookingInstance._id);
      expect(mockOldDriverInstance.currentBookingId).toBeUndefined();
    });

    it('should throw BadRequestException for non-existent booking', async () => {
      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.reassignDriver('non-existent-booking', 'test-driver-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-existent driver', async () => {
      const mockBookingInstance = { ...mockBooking };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.reassignDriver('test-booking-id', 'non-existent-driver')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new driver not available', async () => {
      const mockBookingInstance = { ...mockBooking };
      const mockNewDriverInstance = { 
        ...mockDriver, 
        status: DriverStatus.BUSY,
        availability: DriverAvailability.BUSY
      };

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNewDriverInstance),
      });

      await expect(service.reassignDriver('test-booking-id', 'test-driver-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAvailableDrivers', () => {
    it('should return available drivers within radius', async () => {
      const mockDrivers = [mockDriver];
      (mockDriverModel as any).find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDrivers),
      });

      const location = { latitude: 25.2532, longitude: 55.3644 };
      const result = await service.findAvailableDrivers('sedan', location, 10, 5);

      expect(result).toHaveLength(1);
      expect(result[0].driverId).toBe('test-driver-id');
    });
  });

  describe('getDriverStats', () => {
    it('should return driver statistics', async () => {
      const mockDriverInstance = { ...mockDriver };
      const mockBookings = [
        { status: BookingStatus.COMPLETED, vehicle: { pricing: { total: 100 } } },
        { status: BookingStatus.COMPLETED, vehicle: { pricing: { total: 50 } } },
        { status: BookingStatus.CANCELLED_BY_DRIVER },
      ];

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookings),
      });

      const result = await service.getDriverStats('test-driver-id');

      expect(result.driverId).toBe('test-driver-id');
      expect(result.name).toBe('John Doe');
      expect(result.status).toBe(DriverStatus.ONLINE);
      expect(result.stats.recentCompletedTrips).toBe(2);
      expect(result.stats.recentCancelledTrips).toBe(1);
      expect(result.stats.recentEarnings).toBe(105); // (100 + 50) * 0.7
    });

    it('should throw BadRequestException for non-existent driver', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDriverStats('non-existent-driver')).rejects.toThrow(BadRequestException);
    });
  });
});
