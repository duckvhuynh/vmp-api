import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SimpleDriver, SimpleDriverDocument, DriverStatus, DriverAvailability } from '../schemas/simple-driver.schema';
import { SimpleBooking, SimpleBookingDocument, BookingStatus } from '../../bookings/schemas/simple-booking.schema';
import { 
  UpdateDriverLocationDto, 
  UpdateDriverStatusDto, 
  AcceptJobDto, 
  DeclineJobDto, 
  UpdateJobStatusDto,
  DriverProfileDto,
  DriverJobsListDto,
  DriverJobDto,
  DriverStatsDto
} from '../dto/driver.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectModel(SimpleDriver.name) private driverModel: Model<SimpleDriverDocument>,
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
  ) {}

  async getDriverProfile(driverId: string): Promise<DriverProfileDto> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.mapDriverToProfile(driver);
  }

  async updateDriverLocation(driverId: string, dto: UpdateDriverLocationDto): Promise<void> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    driver.latitude = dto.location.latitude;
    driver.longitude = dto.location.longitude;
    driver.address = dto.location.address;
    driver.lastLocationUpdate = new Date();
    driver.lastActiveAt = new Date();

    await driver.save();
    this.logger.log(`Driver ${driverId} location updated`);
  }

  async updateDriverStatus(driverId: string, dto: UpdateDriverStatusDto): Promise<void> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Validate status transitions
    this.validateStatusTransition(driver.status, dto.status);

    driver.status = dto.status;
    if (dto.availability) {
      driver.availability = dto.availability;
    }
    driver.lastActiveAt = new Date();

    // If going offline, clear current booking
    if (dto.status === DriverStatus.OFFLINE) {
      driver.currentBookingId = undefined;
    }

    await driver.save();
    this.logger.log(`Driver ${driverId} status updated to ${dto.status}`);
  }

  async getDriverJobs(driverId: string): Promise<DriverJobsListDto> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Get assigned bookings for this driver
    const bookings = await this.bookingModel
      .find({
        'driver.driverId': driver._id,
        status: { 
          $in: [
            BookingStatus.DRIVER_ASSIGNED,
            BookingStatus.EN_ROUTE,
            BookingStatus.EN_ROUTE,
            BookingStatus.ARRIVED,
            BookingStatus.WAITING,
            BookingStatus.ON_TRIP
          ]
        }
      })
      .sort({ pickupAt: 1 })
      .exec();

    const jobs = bookings.map(booking => this.mapBookingToJob(booking));
    
    const pending = bookings.filter(b => b.status === BookingStatus.DRIVER_ASSIGNED).length;
    const active = bookings.filter(b => 
      [BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.WAITING, BookingStatus.ON_TRIP].includes(b.status)
    ).length;

    return {
      jobs,
      total: jobs.length,
      pending,
      active,
    };
  }

  async acceptJob(driverId: string, dto: AcceptJobDto): Promise<void> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const booking = await this.bookingModel.findOne({ bookingId: dto.bookingId }).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    // Verify driver is assigned to this booking
    if (!booking.assignedDriver || booking.assignedDriver.toString() !== driver._id.toString()) {
      throw new BadRequestException('Driver is not assigned to this booking');
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.DRIVER_ASSIGNED) {
      throw new BadRequestException(`Cannot accept booking in status: ${booking.status}`);
    }

    // Check if driver is available
    if (driver.status !== DriverStatus.ONLINE || driver.availability !== DriverAvailability.AVAILABLE) {
      throw new BadRequestException('Driver is not available to accept jobs');
    }

    // Update booking status
    booking.status = BookingStatus.EN_ROUTE;

    // Add event
    booking.events.push({
      event: 'driver_accepted',
      status: BookingStatus.EN_ROUTE,
      timestamp: new Date(),
      description: dto.message || 'Driver accepted the booking',
      driverId: driver._id,
    });

    // Update driver status
    driver.status = DriverStatus.BUSY;
    driver.availability = DriverAvailability.ASSIGNED;
    driver.currentBookingId = booking._id;
    driver.lastActiveAt = new Date();

    // Update driver location if provided
    if (dto.currentLocation) {
      driver.latitude = dto.currentLocation.latitude;
      driver.longitude = dto.currentLocation.longitude;
      driver.address = dto.currentLocation.address;
      driver.lastLocationUpdate = new Date();
    }

    await Promise.all([booking.save(), driver.save()]);

    this.logger.log(`Driver ${driverId} accepted booking ${dto.bookingId}`);
  }

  async declineJob(driverId: string, dto: DeclineJobDto): Promise<void> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const booking = await this.bookingModel.findOne({ bookingId: dto.bookingId }).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    // Verify driver is assigned to this booking
    if (!booking.assignedDriver || booking.assignedDriver.toString() !== driver._id.toString()) {
      throw new BadRequestException('Driver is not assigned to this booking');
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.DRIVER_ASSIGNED) {
      throw new BadRequestException(`Cannot decline booking in status: ${booking.status}`);
    }

    // Update booking status
    booking.status = BookingStatus.DRIVER_DECLINED;
    // Driver decline logic - simplified for simple schema

    // Add event
    booking.events.push({
      event: 'driver_declined',
      status: BookingStatus.DRIVER_DECLINED,
      timestamp: new Date(),
      description: `Driver declined: ${dto.reason}`,
      notes: dto.details,
      driverId: driver._id,
    });

    // Clear driver's current booking
    driver.currentBookingId = undefined;
    driver.lastActiveAt = new Date();

    await Promise.all([booking.save(), driver.save()]);

    this.logger.log(`Driver ${driverId} declined booking ${dto.bookingId}: ${dto.reason}`);
  }

  async updateJobStatus(driverId: string, dto: UpdateJobStatusDto): Promise<void> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const booking = await this.bookingModel.findOne({ bookingId: dto.bookingId }).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    // Verify driver is assigned to this booking
    if (!booking.assignedDriver || booking.assignedDriver.toString() !== driver._id.toString()) {
      throw new BadRequestException('Driver is not assigned to this booking');
    }

    // Validate status transition
    this.validateBookingStatusTransition(booking.status, dto.status);

    // Update booking status
    const oldStatus = booking.status;
    booking.status = dto.status as BookingStatus;

    // Set timestamps based on status
    const now = new Date();
    switch (dto.status) {
      case 'en_route':
        if (!booking.actualPickupAt) {
          booking.actualPickupAt = now;
        }
        break;
      case 'arrived':
        // Driver arrived at pickup location
        break;
      case 'on_trip':
        if (!booking.actualPickupAt) {
          booking.actualPickupAt = now;
        }
        break;
      case 'completed':
        booking.actualDropoffAt = now;
        // Update driver stats
        await this.updateDriverStats(driver, booking);
        // Clear current booking
        driver.currentBookingId = undefined;
        driver.status = DriverStatus.ONLINE;
        driver.availability = DriverAvailability.AVAILABLE;
        break;
    }

    // Add event
    booking.events.push({
      event: 'status_update',
      status: dto.status,
      timestamp: now,
      description: dto.message || `Status updated from ${oldStatus} to ${dto.status}`,
      notes: dto.notes,
      driverId: driver._id,
      location: dto.location?.address,
      latitude: dto.location?.latitude,
      longitude: dto.location?.longitude,
    });

    // Update driver location if provided
    if (dto.location) {
      driver.latitude = dto.location.latitude;
      driver.longitude = dto.location.longitude;
      driver.address = dto.location.address;
      driver.lastLocationUpdate = now;
    }

    driver.lastActiveAt = now;

    await Promise.all([booking.save(), driver.save()]);

    this.logger.log(`Driver ${driverId} updated booking ${dto.bookingId} status to ${dto.status}`);
  }

  async getAvailableDrivers(vehicleClass: string, location: { latitude: number; longitude: number }, radiusKm: number = 10): Promise<SimpleDriverDocument[]> {
    // Find drivers within radius who are available
    const drivers = await this.driverModel.find({
      status: DriverStatus.ONLINE,
      availability: DriverAvailability.AVAILABLE,
      isActive: true,
      isVerified: true,
      'vehicle.type': vehicleClass,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    }).exec();

    return drivers;
  }

  private validateStatusTransition(currentStatus: DriverStatus, newStatus: DriverStatus): void {
    const validTransitions: Record<DriverStatus, DriverStatus[]> = {
      [DriverStatus.OFFLINE]: [DriverStatus.ONLINE],
      [DriverStatus.ONLINE]: [DriverStatus.OFFLINE, DriverStatus.BUSY, DriverStatus.ON_BREAK],
      [DriverStatus.BUSY]: [DriverStatus.ONLINE, DriverStatus.ON_BREAK],
      [DriverStatus.ON_BREAK]: [DriverStatus.ONLINE, DriverStatus.OFFLINE],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private validateBookingStatusTransition(currentStatus: BookingStatus, newStatus: string): void {
    const validTransitions: Record<BookingStatus, string[]> = {
      [BookingStatus.EN_ROUTE]: ['arrived'],
      [BookingStatus.ARRIVED]: ['waiting', 'on_trip'],
      [BookingStatus.WAITING]: ['on_trip', 'no_show'],
      [BookingStatus.ON_TRIP]: ['completed'],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED_BY_USER]: [],
      [BookingStatus.DRIVER_DECLINED]: [],
      [BookingStatus.CANCELLED_BY_OPS]: [],
      [BookingStatus.PAYMENT_FAILED]: [],
      [BookingStatus.PENDING_PAYMENT]: [],
      [BookingStatus.CONFIRMED]: [],
      [BookingStatus.DRIVER_ASSIGNED]: [],
      [BookingStatus.NO_SHOW]: [],
    };

    if (currentStatus !== newStatus && !validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid booking status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async updateDriverStats(driver: SimpleDriverDocument, booking: SimpleBookingDocument): Promise<void> {
    driver.totalTrips += 1;
    driver.completedTrips += 1;
    
    // Calculate earnings (simplified - in real app, this would be more complex)
    if (booking.total) {
      driver.totalEarnings += booking.total * 0.7; // Driver gets 70%
    }

    await driver.save();
  }

  private mapDriverToProfile(driver: SimpleDriverDocument): DriverProfileDto {
    return {
      driverId: driver.driverId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      profileImageUrl: undefined,
      status: driver.status,
      availability: driver.availability,
      currentLocation: driver.latitude && driver.longitude ? {
        latitude: driver.latitude,
        longitude: driver.longitude,
        address: driver.address,
      } : undefined,
      vehicle: {
        make: driver.vehicleMake,
        model: driver.vehicleModel,
        year: driver.vehicleYear,
        color: driver.vehicleColor,
        licensePlate: driver.licensePlate,
        type: driver.vehicleType,
        capacity: driver.capacity,
        luggageCapacity: driver.luggageCapacity,
        features: [],
        imageUrl: undefined,
      },
      stats: {
        totalTrips: driver.totalTrips,
        completedTrips: driver.completedTrips,
        cancelledTrips: driver.cancelledTrips,
        totalEarnings: driver.totalEarnings,
        rating: driver.rating,
        totalRatings: driver.totalRatings,
        lastTripDate: undefined,
        onlineHours: 0,
      },
      isActive: driver.isActive,
      isVerified: driver.isVerified,
      lastActiveAt: driver.lastActiveAt?.toISOString(),
      createdAt: (driver as any).createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: (driver as any).updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private mapBookingToJob(booking: SimpleBookingDocument): DriverJobDto {
    const assignedAt = booking.events.find((e: any) => e.event === 'driver_assigned')?.timestamp || booking.createdAt;
    const timeToRespond = 15; // 15 minutes to respond

    return {
      bookingId: booking.bookingId,
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerPhone: booking.passengerPhone,
      pickupLocation: booking.originName || booking.originAddress || 'Unknown location',
      destinationLocation: booking.destinationName || booking.destinationAddress || 'Unknown location',
      pickupTime: booking.pickupAt.toISOString(),
      passengers: booking.passengers,
      luggage: booking.luggage,
      vehicleClass: booking.vehicleClass,
      fare: booking.total,
      currency: booking.currency,
      extras: booking.extras,
      notes: undefined, // Not available in simple schema
      assignedAt: assignedAt.toISOString(),
      timeToRespond,
    };
  }
}
