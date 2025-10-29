import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument, DriverStatus, DriverAvailability } from '../../drivers/schemas/driver.schema';
import { Booking, BookingDocument, BookingStatus } from '../../bookings/schemas/booking.schema';

export interface AssignDriverRequest {
  bookingId: string;
  vehicleClass: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  pickupTime: Date;
  radiusKm?: number;
  maxDriversToNotify?: number;
}

export interface AssignDriverResponse {
  success: boolean;
  assignedDriverId?: string;
  driverName?: string;
  driverPhone?: string;
  message: string;
  notifiedDrivers?: number;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async assignDriver(request: AssignDriverRequest): Promise<AssignDriverResponse> {
    const { bookingId, vehicleClass, pickupLocation, pickupTime, radiusKm = 10, maxDriversToNotify = 5 } = request;

    // Find the booking
    const booking = await this.bookingModel.findOne({ bookingId }).exec();
    if (!booking) {
      throw new BadRequestException(`Booking with ID ${bookingId} not found`);
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot assign driver to booking in status: ${booking.status}`);
    }

    // Check if driver is already assigned
    if (booking.driver) {
      throw new BadRequestException('Driver is already assigned to this booking');
    }

    // Find available drivers
    const availableDrivers = await this.findAvailableDrivers(
      vehicleClass,
      pickupLocation,
      radiusKm,
      maxDriversToNotify
    );

    if (availableDrivers.length === 0) {
      this.logger.warn(`No available drivers found for booking ${bookingId} within ${radiusKm}km`);
      return {
        success: false,
        message: 'No available drivers found in the area',
        notifiedDrivers: 0,
      };
    }

    // For now, assign the closest driver
    // In a real system, you might want to implement more sophisticated assignment logic
    const assignedDriver = availableDrivers[0];

    // Update booking with driver assignment
    booking.status = BookingStatus.DRIVER_ASSIGNED;
    booking.driver = {
      driverId: assignedDriver._id,
      driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
      driverPhone: assignedDriver.phone,
      driverPhoto: assignedDriver.profileImageUrl,
      vehicleMake: assignedDriver.vehicle.make,
      vehicleModel: assignedDriver.vehicle.model,
      vehicleColor: assignedDriver.vehicle.color,
      licensePlate: assignedDriver.vehicle.licensePlate,
      driverRating: assignedDriver.stats.rating,
      assignedAt: new Date(),
    };

    // Add assignment event
    booking.events.push({
      event: 'driver_assigned',
      status: BookingStatus.DRIVER_ASSIGNED,
      timestamp: new Date(),
      description: `Driver ${assignedDriver.firstName} ${assignedDriver.lastName} assigned`,
      driverId: assignedDriver._id,
    });

    // Update driver status
    assignedDriver.currentBookingId = booking._id;
    assignedDriver.lastActiveAt = new Date();

    await Promise.all([booking.save(), assignedDriver.save()]);

    this.logger.log(`Driver ${assignedDriver.driverId} assigned to booking ${bookingId}`);

    return {
      success: true,
      assignedDriverId: assignedDriver.driverId,
      driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
      driverPhone: assignedDriver.phone,
      message: 'Driver assigned successfully',
      notifiedDrivers: availableDrivers.length,
    };
  }

  async reassignDriver(bookingId: string, newDriverId: string): Promise<AssignDriverResponse> {
    const booking = await this.bookingModel.findOne({ bookingId }).exec();
    if (!booking) {
      throw new BadRequestException(`Booking with ID ${bookingId} not found`);
    }

    // Check if booking is in correct status for reassignment
    if (![BookingStatus.DRIVER_ASSIGNED, BookingStatus.DRIVER_DECLINED].includes(booking.status)) {
      throw new BadRequestException(`Cannot reassign driver to booking in status: ${booking.status}`);
    }

    // Find the new driver
    const newDriver = await this.driverModel.findOne({ driverId: newDriverId }).exec();
    if (!newDriver) {
      throw new BadRequestException(`Driver with ID ${newDriverId} not found`);
    }

    // Check if new driver is available
    if (newDriver.status !== 'online' || newDriver.availability !== 'available') {
      throw new BadRequestException('New driver is not available');
    }

    // Clear old driver's current booking if exists
    if (booking.driver) {
      const oldDriver = await this.driverModel.findById(booking.driver.driverId).exec();
      if (oldDriver) {
        oldDriver.currentBookingId = undefined;
        oldDriver.status = DriverStatus.ONLINE;
        oldDriver.availability = DriverAvailability.AVAILABLE;
        await oldDriver.save();
      }
    }

    // Update booking with new driver
    booking.status = BookingStatus.DRIVER_ASSIGNED;
    booking.driver = {
      driverId: newDriver._id,
      driverName: `${newDriver.firstName} ${newDriver.lastName}`,
      driverPhone: newDriver.phone,
      driverPhoto: newDriver.profileImageUrl,
      vehicleMake: newDriver.vehicle.make,
      vehicleModel: newDriver.vehicle.model,
      vehicleColor: newDriver.vehicle.color,
      licensePlate: newDriver.vehicle.licensePlate,
      driverRating: newDriver.stats.rating,
      assignedAt: new Date(),
    };

    // Add reassignment event
    booking.events.push({
      event: 'driver_reassigned',
      status: BookingStatus.DRIVER_ASSIGNED,
      timestamp: new Date(),
      description: `Driver reassigned to ${newDriver.firstName} ${newDriver.lastName}`,
      driverId: newDriver._id,
    });

    // Update new driver status
    newDriver.currentBookingId = booking._id;
    newDriver.lastActiveAt = new Date();

    await Promise.all([booking.save(), newDriver.save()]);

    this.logger.log(`Driver ${newDriver.driverId} reassigned to booking ${bookingId}`);

    return {
      success: true,
      assignedDriverId: newDriver.driverId,
      driverName: `${newDriver.firstName} ${newDriver.lastName}`,
      driverPhone: newDriver.phone,
      message: 'Driver reassigned successfully',
    };
  }

  async findAvailableDrivers(
    vehicleClass: string,
    location: { latitude: number; longitude: number },
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<DriverDocument[]> {
    // Find drivers within radius who are available
    const drivers = await this.driverModel.find({
      status: 'online',
      availability: 'available',
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
    })
    .limit(limit)
    .exec();

    return drivers;
  }

  async getDriverStats(driverId: string): Promise<any> {
    const driver = await this.driverModel.findOne({ driverId }).exec();
    if (!driver) {
      throw new BadRequestException(`Driver with ID ${driverId} not found`);
    }

    // Get recent bookings for this driver
    const recentBookings = await this.bookingModel
      .find({
        'driver.driverId': driver._id,
        status: { $in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED_BY_DRIVER] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })
      .exec();

    const completedTrips = recentBookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    const cancelledTrips = recentBookings.filter(b => b.status === BookingStatus.CANCELLED_BY_DRIVER).length;
    const totalEarnings = recentBookings
      .filter(b => b.status === BookingStatus.COMPLETED)
      .reduce((sum, b) => sum + (b.vehicle?.pricing?.total || 0) * 0.7, 0); // Driver gets 70%

    return {
      driverId: driver.driverId,
      name: `${driver.firstName} ${driver.lastName}`,
      status: driver.status,
      availability: driver.availability,
      currentLocation: driver.currentLocation,
      stats: {
        ...driver.stats,
        recentCompletedTrips: completedTrips,
        recentCancelledTrips: cancelledTrips,
        recentEarnings: totalEarnings,
      },
      lastActiveAt: driver.lastActiveAt,
    };
  }
}
