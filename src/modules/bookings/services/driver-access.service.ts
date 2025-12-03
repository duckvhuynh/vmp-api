import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHmac, randomBytes } from 'crypto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from '../schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverDocument, DriverAvailability } from '../../drivers/schemas/simple-driver.schema';
import {
  DriverBookingResponseDto,
  DriverAcceptBookingDto,
  DriverDeclineBookingDto,
  DriverUpdateStatusDto,
  DriverUpdateLocationDto,
  GenerateDriverLinkResponseDto,
} from '../dto/driver-access.dto';

/**
 * Driver Access Token Payload Structure
 * Format: bookingId:driverId:timestamp:signature
 * 
 * The token is base64url encoded for URL safety
 * Note: Tokens do not expire - they remain valid for the lifetime of the booking
 */
interface DriverAccessPayload {
  bookingId: string;
  driverId: string;
  timestamp: number;
}

@Injectable()
export class DriverAccessService {
  private readonly logger = new Logger(DriverAccessService.name);
  private readonly secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(SimpleDriver.name) private driverModel: Model<SimpleDriverDocument>,
  ) {
    // Use JWT_SECRET or a specific DRIVER_ACCESS_SECRET
    this.secretKey = this.configService.get<string>('DRIVER_ACCESS_SECRET') 
      || this.configService.get<string>('jwtSecret') 
      || 'driver-access-secret-change-me';
  }

  /**
   * Generate a secure driver access token for a booking
   * This token can be used by drivers to access booking details without login
   * Note: Token never expires - valid for the lifetime of the booking
   */
  generateDriverAccessToken(bookingId: string, driverId: string): string {
    const timestamp = Date.now();

    const payload: DriverAccessPayload = {
      bookingId,
      driverId,
      timestamp,
    };

    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString('base64url');
    
    // Create HMAC signature
    const signature = this.createSignature(payloadBase64);
    
    // Combine payload and signature
    const token = `${payloadBase64}.${signature}`;
    
    return token;
  }

  /**
   * Generate the full driver access URL
   * Note: Token never expires - valid for the lifetime of the booking
   */
  generateDriverAccessLink(bookingId: string, driverId: string, baseUrl?: string): GenerateDriverLinkResponseDto {
    const token = this.generateDriverAccessToken(bookingId, driverId);
    
    // Get frontend base URL from config or use default
    const frontendBaseUrl = baseUrl 
      || this.configService.get<string>('FRONTEND_URL') 
      || 'https://visitmauritiusparadise.com';
    
    const driverLink = `${frontendBaseUrl}/driver/booking/${token}`;
    
    return {
      token,
      driverLink,
    };
  }

  /**
   * Validate and decode driver access token
   * Note: Token never expires - only validates signature
   */
  validateAndDecodeToken(token: string): DriverAccessPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid token format');
    }

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = this.createSignature(payloadBase64);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid token signature');
    }

    // Decode payload
    try {
      const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
      const payload: DriverAccessPayload = JSON.parse(payloadString);

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  /**
   * Get booking details for driver using access token
   */
  async getBookingByToken(token: string): Promise<DriverBookingResponseDto> {
    const payload = this.validateAndDecodeToken(token);
    
    // Find the booking
    const booking = await this.bookingModel.findOne({ bookingId: payload.bookingId }).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify the driver is assigned to this booking
    if (!booking.assignedDriver || booking.assignedDriver.toString() !== payload.driverId) {
      throw new UnauthorizedException('You are not assigned to this booking');
    }

    // Get driver details
    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.mapToDriverResponse(booking, driver);
  }

  /**
   * Driver accepts the booking
   */
  async acceptBooking(token: string, dto: DriverAcceptBookingDto): Promise<DriverBookingResponseDto> {
    const payload = this.validateAndDecodeToken(token);
    
    const booking = await this.findAndValidateBooking(payload.bookingId, payload.driverId);
    
    // Check if booking is in correct status
    if (booking.status !== BookingStatus.DRIVER_ASSIGNED) {
      throw new BadRequestException(`Cannot accept booking with status: ${booking.status}`);
    }

    // Update booking status
    booking.status = BookingStatus.CONFIRMED; // Or a specific DRIVER_ACCEPTED status if needed
    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: BookingEventName.DRIVER_ACCEPTED,
      status: booking.status,
      timestamp: new Date(),
      description: dto.notes || 'Booking accepted by driver',
      driverId: new Types.ObjectId(payload.driverId),
    });

    await booking.save();

    // Update driver availability
    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (driver) {
      driver.availability = DriverAvailability.ASSIGNED;
      driver.currentBookingId = booking._id;
      driver.updatedAt = new Date();
      await driver.save();
    }

    this.logger.log(`Driver ${payload.driverId} accepted booking ${booking.bookingId}`);

    return this.mapToDriverResponse(booking, driver!);
  }

  /**
   * Driver declines the booking
   */
  async declineBooking(token: string, dto: DriverDeclineBookingDto): Promise<{ success: boolean; message: string }> {
    const payload = this.validateAndDecodeToken(token);
    
    const booking = await this.findAndValidateBooking(payload.bookingId, payload.driverId);
    
    // Check if booking is in correct status
    if (booking.status !== BookingStatus.DRIVER_ASSIGNED) {
      throw new BadRequestException(`Cannot decline booking with status: ${booking.status}`);
    }

    // Update booking status
    booking.status = BookingStatus.DRIVER_DECLINED;
    booking.assignedDriver = undefined;
    booking.updatedAt = new Date();

    // Add event
    booking.events.push({
      event: BookingEventName.DRIVER_DECLINED,
      status: BookingStatus.DRIVER_DECLINED,
      timestamp: new Date(),
      description: `Driver declined: ${dto.reason || 'No reason provided'}`,
      driverId: new Types.ObjectId(payload.driverId),
    });

    await booking.save();

    // Update driver availability
    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (driver) {
      driver.availability = DriverAvailability.AVAILABLE;
      driver.currentBookingId = undefined;
      driver.cancelledTrips = (driver.cancelledTrips || 0) + 1;
      driver.updatedAt = new Date();
      await driver.save();
    }

    this.logger.log(`Driver ${payload.driverId} declined booking ${booking.bookingId}: ${dto.reason}`);

    return {
      success: true,
      message: 'Booking declined successfully',
    };
  }

  /**
   * Driver updates booking status (en_route, arrived, waiting, on_trip, completed)
   */
  async updateBookingStatus(token: string, dto: DriverUpdateStatusDto): Promise<DriverBookingResponseDto> {
    const payload = this.validateAndDecodeToken(token);
    
    const booking = await this.findAndValidateBooking(payload.bookingId, payload.driverId);
    
    // Validate status transition
    this.validateDriverStatusTransition(booking.status, dto.status);

    const previousStatus = booking.status;
    booking.status = dto.status;
    booking.updatedAt = new Date();

    // Handle specific status updates
    if (dto.status === BookingStatus.ON_TRIP && !booking.actualPickupAt) {
      booking.actualPickupAt = new Date();
    }
    if (dto.status === BookingStatus.COMPLETED && !booking.actualDropoffAt) {
      booking.actualDropoffAt = new Date();
    }

    // Map status to event name
    const eventName = this.getEventNameForStatus(dto.status);

    // Add event
    booking.events.push({
      event: eventName,
      status: dto.status,
      timestamp: new Date(),
      description: dto.notes || `Status updated to ${dto.status}`,
      latitude: dto.latitude,
      longitude: dto.longitude,
      driverId: new Types.ObjectId(payload.driverId),
    });

    await booking.save();

    // Update driver status based on booking status
    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (driver) {
      if (dto.status === BookingStatus.ON_TRIP) {
        driver.availability = DriverAvailability.ON_TRIP;
      } else if (dto.status === BookingStatus.COMPLETED) {
        driver.availability = DriverAvailability.AVAILABLE;
        driver.currentBookingId = undefined;
        driver.completedTrips = (driver.completedTrips || 0) + 1;
        driver.totalTrips = (driver.totalTrips || 0) + 1;
        // Add earnings (driver gets 70% of total)
        driver.totalEarnings = (driver.totalEarnings || 0) + (booking.total * 0.7);
      }
      
      if (dto.latitude && dto.longitude) {
        driver.latitude = dto.latitude;
        driver.longitude = dto.longitude;
        driver.lastLocationUpdate = new Date();
      }
      
      driver.lastActiveAt = new Date();
      driver.updatedAt = new Date();
      await driver.save();
    }

    this.logger.log(`Driver ${payload.driverId} updated booking ${booking.bookingId} status: ${previousStatus} -> ${dto.status}`);

    return this.mapToDriverResponse(booking, driver!);
  }

  /**
   * Driver updates their current location
   */
  async updateDriverLocation(token: string, dto: DriverUpdateLocationDto): Promise<{ success: boolean; message: string }> {
    const payload = this.validateAndDecodeToken(token);
    
    // Validate the booking still exists and driver is assigned
    await this.findAndValidateBooking(payload.bookingId, payload.driverId);

    // Update driver location
    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.latitude = dto.latitude;
    driver.longitude = dto.longitude;
    if (dto.address) {
      driver.address = dto.address;
    }
    driver.lastLocationUpdate = new Date();
    driver.lastActiveAt = new Date();
    driver.updatedAt = new Date();
    
    await driver.save();

    return {
      success: true,
      message: 'Location updated successfully',
    };
  }

  /**
   * Get driver's current assigned bookings using token
   */
  async getDriverBookings(token: string): Promise<DriverBookingResponseDto[]> {
    const payload = this.validateAndDecodeToken(token);
    
    // Find all bookings assigned to this driver
    const bookings = await this.bookingModel.find({
      assignedDriver: new Types.ObjectId(payload.driverId),
      status: {
        $in: [
          BookingStatus.DRIVER_ASSIGNED,
          BookingStatus.CONFIRMED,
          BookingStatus.EN_ROUTE,
          BookingStatus.ARRIVED,
          BookingStatus.WAITING,
          BookingStatus.ON_TRIP,
        ],
      },
    }).sort({ pickupAt: 1 }).exec();

    const driver = await this.driverModel.findById(payload.driverId).exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return bookings.map(booking => this.mapToDriverResponse(booking, driver));
  }

  // ============ Private Helper Methods ============

  private createSignature(data: string): string {
    return createHmac('sha256', this.secretKey)
      .update(data)
      .digest('base64url');
  }

  private async findAndValidateBooking(bookingId: string, driverId: string): Promise<SimpleBookingDocument> {
    const booking = await this.bookingModel.findOne({ bookingId }).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify the driver is assigned to this booking
    if (!booking.assignedDriver || booking.assignedDriver.toString() !== driverId) {
      throw new UnauthorizedException('You are not assigned to this booking');
    }

    return booking;
  }

  private validateDriverStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.DRIVER_ASSIGNED]: [BookingStatus.EN_ROUTE],
      [BookingStatus.CONFIRMED]: [BookingStatus.EN_ROUTE],
      [BookingStatus.EN_ROUTE]: [BookingStatus.ARRIVED],
      [BookingStatus.ARRIVED]: [BookingStatus.WAITING, BookingStatus.ON_TRIP, BookingStatus.NO_SHOW],
      [BookingStatus.WAITING]: [BookingStatus.ON_TRIP, BookingStatus.NO_SHOW],
      [BookingStatus.ON_TRIP]: [BookingStatus.COMPLETED],
      // Terminal states
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.NO_SHOW]: [],
      [BookingStatus.CANCELLED_BY_USER]: [],
      [BookingStatus.CANCELLED_BY_OPS]: [],
      [BookingStatus.PENDING_PAYMENT]: [],
      [BookingStatus.PAYMENT_FAILED]: [],
      [BookingStatus.DRIVER_DECLINED]: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private getEventNameForStatus(status: BookingStatus): string {
    const eventMap: Record<BookingStatus, string> = {
      [BookingStatus.EN_ROUTE]: BookingEventName.DRIVER_EN_ROUTE,
      [BookingStatus.ARRIVED]: BookingEventName.DRIVER_ARRIVED,
      [BookingStatus.WAITING]: BookingEventName.DRIVER_WAITING,
      [BookingStatus.ON_TRIP]: BookingEventName.DRIVER_ON_TRIP,
      [BookingStatus.COMPLETED]: BookingEventName.DRIVER_COMPLETED,
      [BookingStatus.NO_SHOW]: 'no_show',
      [BookingStatus.DRIVER_ASSIGNED]: BookingEventName.DRIVER_ASSIGNED,
      [BookingStatus.CONFIRMED]: BookingEventName.DRIVER_ACCEPTED,
      [BookingStatus.DRIVER_DECLINED]: BookingEventName.DRIVER_DECLINED,
      [BookingStatus.PENDING_PAYMENT]: BookingEventName.CREATED,
      [BookingStatus.PAYMENT_FAILED]: BookingEventName.PAYMENT_FAILED,
      [BookingStatus.CANCELLED_BY_USER]: BookingEventName.CANCELLED,
      [BookingStatus.CANCELLED_BY_OPS]: BookingEventName.CANCELLED,
    };
    return eventMap[status] || BookingEventName.STATUS_UPDATE;
  }

  private mapToDriverResponse(booking: SimpleBookingDocument, driver: SimpleDriverDocument): DriverBookingResponseDto {
    return {
      bookingId: booking.bookingId,
      status: booking.status,
      
      // Passenger info (limited for privacy)
      passenger: {
        firstName: booking.passengerFirstName,
        lastName: booking.passengerLastName,
        phone: booking.passengerPhone,
      },
      
      // Origin
      origin: {
        type: booking.originType,
        name: booking.originName,
        address: booking.originAddress,
        latitude: booking.originLatitude,
        longitude: booking.originLongitude,
        airportCode: booking.originAirportCode,
        terminal: booking.originTerminal,
      },
      
      // Destination
      destination: {
        type: booking.destinationType,
        name: booking.destinationName,
        address: booking.destinationAddress,
        latitude: booking.destinationLatitude,
        longitude: booking.destinationLongitude,
        airportCode: booking.destinationAirportCode,
        terminal: booking.destinationTerminal,
      },
      
      // Trip details
      pickupAt: booking.pickupAt,
      flightNumber: booking.flightNumber,
      flightDate: booking.flightDate,
      passengers: booking.passengers,
      luggage: booking.luggage,
      extras: booking.extras,
      
      // Meet & greet
      signText: booking.signText,
      notes: booking.notes,
      
      // Vehicle
      vehicle: {
        class: booking.vehicleClass,
        name: booking.vehicleName,
      },
      
      // Pricing (driver sees this for trip info)
      pricing: {
        total: booking.total,
        currency: booking.currency,
      },
      
      // Driver info
      driver: driver ? {
        id: driver._id.toString(),
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phone,
        vehicle: {
          make: driver.vehicleMake,
          model: driver.vehicleModel,
          color: driver.vehicleColor,
          licensePlate: driver.licensePlate,
        },
      } : undefined,
      
      // Timestamps
      actualPickupAt: booking.actualPickupAt,
      actualDropoffAt: booking.actualDropoffAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      
      // Available actions based on status
      availableActions: this.getAvailableActions(booking.status),
    };
  }

  private getAvailableActions(status: BookingStatus): string[] {
    const actionsMap: Record<BookingStatus, string[]> = {
      [BookingStatus.DRIVER_ASSIGNED]: ['accept', 'decline'],
      [BookingStatus.CONFIRMED]: ['start_trip'],
      [BookingStatus.EN_ROUTE]: ['arrived'],
      [BookingStatus.ARRIVED]: ['start_waiting', 'start_trip', 'no_show'],
      [BookingStatus.WAITING]: ['start_trip', 'no_show'],
      [BookingStatus.ON_TRIP]: ['complete'],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.NO_SHOW]: [],
      [BookingStatus.CANCELLED_BY_USER]: [],
      [BookingStatus.CANCELLED_BY_OPS]: [],
      [BookingStatus.PENDING_PAYMENT]: [],
      [BookingStatus.PAYMENT_FAILED]: [],
      [BookingStatus.DRIVER_DECLINED]: [],
    };
    return actionsMap[status] || [];
  }
}

