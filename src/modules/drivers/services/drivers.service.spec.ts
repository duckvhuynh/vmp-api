import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriversService } from './drivers.service';
import { SimpleDriver, DriverStatus, DriverAvailability } from '../schemas/simple-driver.schema';
import { SimpleBooking, BookingStatus } from '../../bookings/schemas/simple-booking.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DriversService', () => {
  let service: DriversService;
  let driverModel: Model<SimpleDriver>;
  let bookingModel: Model<SimpleBooking>;

  const mockDriverModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
    driverId: 'test-driver-id',
    status: DriverStatus.ONLINE,
    availability: DriverAvailability.AVAILABLE,
    lastActiveAt: new Date(),
  }));
  
  Object.assign(mockDriverModel, {
    findOne: jest.fn(),
    find: jest.fn(),
  });

  const mockBookingModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
    bookingId: 'test-booking-id',
    status: BookingStatus.DRIVER_ASSIGNED,
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
    email: 'john.doe@example.com',
    phone: '+971501234567',
    status: DriverStatus.ONLINE,
    availability: DriverAvailability.AVAILABLE,
    latitude: 25.2532,
    longitude: 55.3644,
    address: 'Dubai Airport',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: '2020',
    vehicleColor: 'White',
    licensePlate: 'ABC-1234',
    vehicleType: 'sedan',
    capacity: 4,
    luggageCapacity: 2,
    totalTrips: 100,
    completedTrips: 95,
    cancelledTrips: 5,
    totalEarnings: 10000,
    rating: 4.8,
    totalRatings: 100,
    isActive: true,
    isVerified: true,
    lastActiveAt: new Date(),
    lastLocationUpdate: new Date(),
    currentBookingId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBooking = {
    _id: '507f1f77bcf86cd799439022',
    bookingId: 'test-booking-id',
    status: BookingStatus.DRIVER_ASSIGNED,
    userId: '507f1f77bcf86cd799439033',
    passengerFirstName: 'Jane',
    passengerLastName: 'Smith',
    passengerPhone: '+971501234568',
    originName: 'Dubai Airport Terminal 3',
    originAddress: 'Dubai Airport',
    originLatitude: 25.2532,
    originLongitude: 55.3644,
    destinationName: 'Downtown Dubai',
    destinationAddress: 'Downtown Dubai',
    destinationLatitude: 25.1972,
    destinationLongitude: 55.2744,
    pickupAt: new Date(Date.now() + 3600000), // 1 hour from now
    passengers: 2,
    luggage: 1,
    vehicleClass: 'economy',
    vehicleName: 'Economy',
    vehicleCapacity: 3,
    vehicleBagCapacity: 2,
    baseFare: 50.0,
    total: 75.50,
    currency: 'AED',
    assignedDriver: '507f1f77bcf86cd799439011',
    events: [] as any[],
    actualPickupAt: undefined,
    actualDropoffAt: undefined,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getModelToken(SimpleDriver.name),
          useValue: mockDriverModel,
        },
        {
          provide: getModelToken(SimpleBooking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    driverModel = module.get<Model<SimpleDriver>>(getModelToken(SimpleDriver.name));
    bookingModel = module.get<Model<SimpleBooking>>(getModelToken(SimpleBooking.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDriverProfile', () => {
    it('should return driver profile successfully', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriver),
      });

      const result = await service.getDriverProfile('test-driver-id');

      expect(result).toBeDefined();
      expect(result.driverId).toBe('test-driver-id');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.status).toBe(DriverStatus.ONLINE);
      expect(result.availability).toBe(DriverAvailability.AVAILABLE);
    });

    it('should throw NotFoundException for non-existent driver', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDriverProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDriverLocation', () => {
    it('should update driver location successfully', async () => {
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      const locationDto = {
        location: {
          latitude: 25.3000,
          longitude: 55.4000,
          address: 'New Location',
          accuracy: 10,
        },
      };

      await service.updateDriverLocation('test-driver-id', locationDto);

      expect(mockDriverInstance.latitude).toBe(25.3000);
      expect(mockDriverInstance.longitude).toBe(55.4000);
      expect(mockDriverInstance.lastLocationUpdate).toBeDefined();
      expect(mockDriverInstance.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent driver', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const locationDto = {
        location: {
          latitude: 25.3000,
          longitude: 55.4000,
        },
      };

      await expect(service.updateDriverLocation('non-existent', locationDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDriverStatus', () => {
    it('should update driver status successfully', async () => {
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      const statusDto = {
        status: DriverStatus.BUSY,
        availability: DriverAvailability.ASSIGNED,
      };

      await service.updateDriverStatus('test-driver-id', statusDto);

      expect(mockDriverInstance.status).toBe(DriverStatus.BUSY);
      expect(mockDriverInstance.availability).toBe(DriverAvailability.ASSIGNED);
      expect(mockDriverInstance.lastActiveAt).toBeDefined();
      expect(mockDriverInstance.save).toHaveBeenCalled();
    });

    it('should clear current booking when going offline', async () => {
      const mockDriverInstance = { 
        ...mockDriver, 
        currentBookingId: 'some-booking-id',
        save: jest.fn().mockResolvedValue(true) 
      };
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      const statusDto = {
        status: DriverStatus.OFFLINE,
      };

      await service.updateDriverStatus('test-driver-id', statusDto);

      expect(mockDriverInstance.status).toBe(DriverStatus.OFFLINE);
      expect(mockDriverInstance.currentBookingId).toBeUndefined();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockDriverInstance = { ...mockDriver, status: DriverStatus.OFFLINE };
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      const statusDto = {
        status: DriverStatus.BUSY, // Cannot go directly from OFFLINE to BUSY
      };

      await expect(service.updateDriverStatus('test-driver-id', statusDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDriverJobs', () => {
    it('should return driver jobs successfully', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriver),
      });

      (mockBookingModel as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockBooking]),
        }),
      });

      const result = await service.getDriverJobs('test-driver-id');

      expect(result).toBeDefined();
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].bookingId).toBe('test-booking-id');
      expect(result.jobs[0].passengerName).toBe('Jane Smith');
      expect(result.total).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.active).toBe(0);
    });

    it('should throw NotFoundException for non-existent driver', async () => {
      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDriverJobs('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptJob', () => {
    it('should accept job successfully', async () => {
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      const mockBookingInstance = { ...mockBooking, save: jest.fn().mockResolvedValue(true) };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const acceptDto = {
        bookingId: 'test-booking-id',
        message: 'On my way!',
        currentLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
        },
      };

      await service.acceptJob('test-driver-id', acceptDto);

      expect(mockBookingInstance.status).toBe(BookingStatus.EN_ROUTE);
      expect(mockBookingInstance.events).toHaveLength(1);
      expect((mockBookingInstance.events[0] as any).event).toBe('driver_accepted');
      expect(mockDriverInstance.status).toBe(DriverStatus.BUSY);
      expect(mockDriverInstance.availability).toBe(DriverAvailability.ASSIGNED);
      expect(mockDriverInstance.currentBookingId).toBe(mockBookingInstance._id);
    });

    it('should throw BadRequestException if driver not assigned to booking', async () => {
      const mockDriverInstance = { ...mockDriver };
      const mockBookingInstance = { 
        ...mockBooking, 
        assignedDriver: 'different-driver-id',
        save: jest.fn().mockResolvedValue(true)
      };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const acceptDto = {
        bookingId: 'test-booking-id',
      };

      await expect(service.acceptJob('test-driver-id', acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking not in correct status', async () => {
      const mockDriverInstance = { ...mockDriver };
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.CONFIRMED 
      };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const acceptDto = {
        bookingId: 'test-booking-id',
      };

      await expect(service.acceptJob('test-driver-id', acceptDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('declineJob', () => {
    it('should decline job successfully', async () => {
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      const mockBookingInstance = { ...mockBooking, events: [], save: jest.fn().mockResolvedValue(true) };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const declineDto = {
        bookingId: 'test-booking-id',
        reason: 'Vehicle breakdown',
        details: 'My car is not working properly',
      };

      await service.declineJob('test-driver-id', declineDto);

      expect(mockBookingInstance.status).toBe(BookingStatus.DRIVER_DECLINED);
      expect(mockBookingInstance.events).toHaveLength(1);
      expect((mockBookingInstance.events[0] as any).event).toBe('driver_declined');
      expect(mockDriverInstance.currentBookingId).toBeUndefined();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to en_route successfully', async () => {
      const mockDriverInstance = { ...mockDriver, save: jest.fn().mockResolvedValue(true) };
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.EN_ROUTE,
        events: [],
        save: jest.fn().mockResolvedValue(true)
      };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const statusDto = {
        bookingId: 'test-booking-id',
        status: 'en_route',
        message: 'On my way to pickup location',
        location: {
          latitude: 25.2532,
          longitude: 55.3644,
          address: 'Current location',
        },
      };

      await service.updateJobStatus('test-driver-id', statusDto);

      expect(mockBookingInstance.status).toBe('en_route');
      expect(mockBookingInstance.actualPickupAt).toBeDefined();
      expect(mockBookingInstance.events).toHaveLength(1);
      expect((mockBookingInstance.events[0] as any).event).toBe('status_update');
    });

    it('should complete job and update driver stats', async () => {
      const mockDriverInstance = { 
        ...mockDriver, 
        currentBookingId: 'booking-id',
        save: jest.fn().mockResolvedValue(true) 
      };
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.ON_TRIP,
        save: jest.fn().mockResolvedValue(true) 
      };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const statusDto = {
        bookingId: 'test-booking-id',
        status: 'completed',
        message: 'Trip completed successfully',
      };

      await service.updateJobStatus('test-driver-id', statusDto);

      expect(mockBookingInstance.status).toBe('completed');
      expect(mockBookingInstance.actualDropoffAt).toBeDefined();
      expect(mockDriverInstance.currentBookingId).toBeUndefined();
      expect(mockDriverInstance.status).toBe(DriverStatus.ONLINE);
      expect(mockDriverInstance.availability).toBe(DriverAvailability.AVAILABLE);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockDriverInstance = { ...mockDriver };
      const mockBookingInstance = { 
        ...mockBooking, 
        status: BookingStatus.EN_ROUTE 
      };

      (mockDriverModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDriverInstance),
      });

      (mockBookingModel as any).findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingInstance),
      });

      const statusDto = {
        bookingId: 'test-booking-id',
        status: 'completed', // Cannot go directly from EN_ROUTE to COMPLETED
      };

      await expect(service.updateJobStatus('test-driver-id', statusDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableDrivers', () => {
    it('should return available drivers within radius', async () => {
      const mockDrivers = [mockDriver];
      (mockDriverModel as any).find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDrivers),
      });

      const location = { latitude: 25.2532, longitude: 55.3644 };
      const result = await service.getAvailableDrivers('sedan', location, 10);

      expect(result).toHaveLength(1);
      expect(result[0].driverId).toBe('test-driver-id');
    });
  });
});
