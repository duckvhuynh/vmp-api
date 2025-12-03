import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from '../schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverDocument } from '../../drivers/schemas/simple-driver.schema';
import { FiservService } from '../../payments/services/fiserv.service';
import {
  CustomerBookingResponseDto,
  CustomerCancelBookingDto,
  CustomerCancelResponseDto,
  CustomerCreateCheckoutDto,
  CustomerCheckoutResponseDto,
  BookingAccessInfoDto,
  CustomerPaymentStatusDto,
  CustomerDriverDto,
  CustomerBookingEventDto,
} from '../dto/customer-access.dto';

@Injectable()
export class CustomerAccessService {
  private readonly logger = new Logger(CustomerAccessService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(SimpleDriver.name) private driverModel: Model<SimpleDriverDocument>,
    private readonly fiservService: FiservService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') 
      || this.configService.get<string>('frontendUrl')
      || 'https://visitmauritiusparadise.com';
  }

  /**
   * Generate a short, unique access code (8 alphanumeric characters)
   * URL-safe and easy to type/share
   */
  generateAccessCode(): string {
    // Generate 6 random bytes and convert to base36 (0-9, a-z)
    // Then take first 8 characters and uppercase
    const bytes = randomBytes(6);
    const code = bytes.toString('hex').substring(0, 8).toUpperCase();
    return code;
  }

  /**
   * Generate access code for a booking and save it
   * Called when booking is created
   */
  async assignAccessCode(bookingId: string): Promise<string> {
    const booking = await this.findBookingByIdOrBookingId(bookingId);
    
    // If already has access code, return it
    if (booking.accessCode) {
      return booking.accessCode;
    }

    // Generate unique access code (retry if collision)
    let accessCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      accessCode = this.generateAccessCode();
      const existing = await this.bookingModel.findOne({ accessCode }).exec();
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new BadRequestException('Failed to generate unique access code');
    }

    booking.accessCode = accessCode;
    booking.updatedAt = new Date();
    await booking.save();

    this.logger.log(`Access code ${accessCode} assigned to booking ${booking.bookingId}`);
    
    return accessCode;
  }

  /**
   * Get booking access info (for embedding in emails, SMS, etc.)
   */
  async getBookingAccessInfo(bookingId: string): Promise<BookingAccessInfoDto> {
    const booking = await this.findBookingByIdOrBookingId(bookingId);
    
    // Ensure access code exists
    if (!booking.accessCode) {
      await this.assignAccessCode(bookingId);
      await booking.save();
    }

    return {
      bookingId: booking.bookingId,
      accessCode: booking.accessCode!,
      bookingUrl: `${this.frontendUrl}/my-booking/${booking.accessCode}`,
    };
  }

  /**
   * Get booking details by access code (for customer booking page)
   */
  async getBookingByAccessCode(accessCode: string): Promise<CustomerBookingResponseDto> {
    const booking = await this.bookingModel.findOne({ 
      accessCode: accessCode.toUpperCase() 
    }).exec();

    if (!booking) {
      throw new NotFoundException('Booking not found. Please check your booking code.');
    }

    // Get driver info if assigned
    let driverInfo: CustomerDriverDto | undefined;
    if (booking.assignedDriver) {
      const driver = await this.driverModel.findById(booking.assignedDriver).exec();
      if (driver) {
        driverInfo = {
          name: `${driver.firstName} ${driver.lastName.charAt(0)}.`, // Privacy: only show first initial of last name
          phone: driver.phone,
          rating: driver.rating || undefined,
          vehicle: {
            make: driver.vehicleMake,
            model: driver.vehicleModel,
            color: driver.vehicleColor,
            licensePlate: driver.licensePlate,
          },
        };
      }
    }

    return this.mapToCustomerResponse(booking, driverInfo);
  }

  /**
   * Get booking by bookingId (alternative lookup method)
   */
  async getBookingByBookingId(bookingId: string): Promise<CustomerBookingResponseDto> {
    const booking = await this.bookingModel.findOne({ bookingId }).exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Get driver info if assigned
    let driverInfo: CustomerDriverDto | undefined;
    if (booking.assignedDriver) {
      const driver = await this.driverModel.findById(booking.assignedDriver).exec();
      if (driver) {
        driverInfo = {
          name: `${driver.firstName} ${driver.lastName.charAt(0)}.`,
          phone: driver.phone,
          rating: driver.rating || undefined,
          vehicle: {
            make: driver.vehicleMake,
            model: driver.vehicleModel,
            color: driver.vehicleColor,
            licensePlate: driver.licensePlate,
          },
        };
      }
    }

    return this.mapToCustomerResponse(booking, driverInfo);
  }

  /**
   * Create payment checkout for unpaid booking
   */
  async createCheckout(
    accessCode: string,
    dto: CustomerCreateCheckoutDto,
  ): Promise<CustomerCheckoutResponseDto> {
    const booking = await this.bookingModel.findOne({ 
      accessCode: accessCode.toUpperCase() 
    }).exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if payment is already completed
    if (booking.paymentConfirmedAt) {
      throw new BadRequestException('Payment has already been completed for this booking');
    }

    // Check if booking can accept payment
    const nonPayableStatuses = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
    ];
    if (nonPayableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot process payment for booking with status: ${booking.status}`);
    }

    // Create Fiserv checkout
    const checkout = await this.fiservService.createCheckout({
      bookingId: booking.bookingId,
      total: booking.total,
      currency: booking.currency,
      customerEmail: booking.passengerEmail,
      customerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      description: `Airport transfer - ${booking.originName || 'Pickup'} to ${booking.destinationName || 'Destination'}`,
      successUrl: dto.successUrl || `${this.frontendUrl}/my-booking/${booking.accessCode}?payment=success`,
      failureUrl: dto.failureUrl || `${this.frontendUrl}/my-booking/${booking.accessCode}?payment=failed`,
    });

    this.logger.log(`Checkout created for booking ${booking.bookingId} via customer access`);

    return {
      checkoutId: checkout.checkoutId,
      redirectionUrl: checkout.redirectionUrl,
      bookingId: booking.bookingId,
      amount: booking.total,
      currency: booking.currency,
    };
  }

  /**
   * Cancel booking by customer
   */
  async cancelBooking(
    accessCode: string,
    dto: CustomerCancelBookingDto,
  ): Promise<CustomerCancelResponseDto> {
    const booking = await this.bookingModel.findOne({ 
      accessCode: accessCode.toUpperCase() 
    }).exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking can be cancelled
    const nonCancellableStatuses = [
      BookingStatus.ON_TRIP,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
    ];

    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel booking with status: ${this.getStatusDisplay(booking.status)}`);
    }

    // Calculate refund based on time until pickup
    const now = new Date();
    const hoursUntilPickup = (booking.pickupAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    let refundStatus = 'none';

    if (booking.paymentConfirmedAt) {
      if (hoursUntilPickup >= 24) {
        // Full refund if cancelled 24+ hours before
        refundAmount = booking.total;
        refundStatus = 'pending';
      } else if (hoursUntilPickup >= 2) {
        // 50% refund if cancelled 2-24 hours before
        refundAmount = booking.total * 0.5;
        refundStatus = 'pending';
      }
      // No refund if less than 2 hours
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED_BY_USER;
    booking.updatedAt = now;
    booking.events.push({
      event: BookingEventName.CANCELLED,
      status: BookingStatus.CANCELLED_BY_USER,
      timestamp: now,
      description: dto.reason 
        ? `Cancelled by customer: ${dto.reason}` 
        : 'Cancelled by customer',
    });

    await booking.save();

    this.logger.log(`Booking ${booking.bookingId} cancelled by customer`);

    return {
      success: true,
      message: refundAmount > 0
        ? `Booking cancelled. A refund of ${refundAmount} ${booking.currency} will be processed.`
        : 'Booking cancelled successfully.',
      bookingId: booking.bookingId,
      status: BookingStatus.CANCELLED_BY_USER,
      refund: refundAmount > 0
        ? { amount: refundAmount, currency: booking.currency, status: refundStatus }
        : undefined,
    };
  }

  // ============ Private Helper Methods ============

  private async findBookingByIdOrBookingId(id: string): Promise<SimpleBookingDocument> {
    let booking: SimpleBookingDocument | null = null;

    // Try by MongoDB ObjectId
    if (Types.ObjectId.isValid(id)) {
      booking = await this.bookingModel.findById(id).exec();
    }

    // Try by bookingId field
    if (!booking) {
      booking = await this.bookingModel.findOne({ bookingId: id }).exec();
    }

    // Try by accessCode
    if (!booking) {
      booking = await this.bookingModel.findOne({ accessCode: id.toUpperCase() }).exec();
    }

    if (!booking) {
      throw new NotFoundException(`Booking not found`);
    }

    return booking;
  }

  private getStatusDisplay(status: BookingStatus): string {
    const displayMap: Record<BookingStatus, string> = {
      [BookingStatus.PENDING_PAYMENT]: 'Pending Payment',
      [BookingStatus.CONFIRMED]: 'Confirmed',
      [BookingStatus.DRIVER_ASSIGNED]: 'Driver Assigned',
      [BookingStatus.DRIVER_DECLINED]: 'Finding New Driver',
      [BookingStatus.EN_ROUTE]: 'Driver En Route',
      [BookingStatus.ARRIVED]: 'Driver Arrived',
      [BookingStatus.WAITING]: 'Driver Waiting',
      [BookingStatus.NO_SHOW]: 'No Show',
      [BookingStatus.ON_TRIP]: 'Trip In Progress',
      [BookingStatus.COMPLETED]: 'Completed',
      [BookingStatus.CANCELLED_BY_USER]: 'Cancelled',
      [BookingStatus.CANCELLED_BY_OPS]: 'Cancelled',
      [BookingStatus.PAYMENT_FAILED]: 'Payment Failed',
    };
    return displayMap[status] || status;
  }

  private getStatusMessage(status: BookingStatus, hasDriver: boolean): string {
    const messageMap: Record<BookingStatus, string> = {
      [BookingStatus.PENDING_PAYMENT]: 'Please complete your payment to confirm the booking.',
      [BookingStatus.CONFIRMED]: hasDriver 
        ? 'Your booking is confirmed with an assigned driver.'
        : 'Your booking is confirmed. A driver will be assigned soon.',
      [BookingStatus.DRIVER_ASSIGNED]: 'A driver has been assigned to your booking.',
      [BookingStatus.DRIVER_DECLINED]: 'We are finding a new driver for your booking.',
      [BookingStatus.EN_ROUTE]: 'Your driver is on the way to pick you up.',
      [BookingStatus.ARRIVED]: 'Your driver has arrived at the pickup location.',
      [BookingStatus.WAITING]: 'Your driver is waiting for you.',
      [BookingStatus.NO_SHOW]: 'You did not show up at the pickup location.',
      [BookingStatus.ON_TRIP]: 'Your trip is in progress. Enjoy your ride!',
      [BookingStatus.COMPLETED]: 'Your trip has been completed. Thank you for riding with us!',
      [BookingStatus.CANCELLED_BY_USER]: 'This booking has been cancelled.',
      [BookingStatus.CANCELLED_BY_OPS]: 'This booking has been cancelled.',
      [BookingStatus.PAYMENT_FAILED]: 'Payment failed. Please try again or use a different payment method.',
    };
    return messageMap[status] || 'Booking status updated.';
  }

  private getPaymentStatus(booking: SimpleBookingDocument): CustomerPaymentStatusDto {
    const isPaid = !!booking.paymentConfirmedAt;
    
    // Determine if payment can be made
    const nonPayableStatuses = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
      BookingStatus.ON_TRIP,
    ];
    
    let canPay = !isPaid && !nonPayableStatuses.includes(booking.status);
    let cannotPayReason: string | undefined;

    if (isPaid) {
      cannotPayReason = 'Payment already completed';
    } else if (booking.status === BookingStatus.CANCELLED_BY_USER || booking.status === BookingStatus.CANCELLED_BY_OPS) {
      cannotPayReason = 'Booking has been cancelled';
    } else if (booking.status === BookingStatus.COMPLETED) {
      cannotPayReason = 'Booking has been completed';
    } else if (booking.status === BookingStatus.ON_TRIP) {
      cannotPayReason = 'Trip is in progress';
    }

    return {
      isPaid,
      paidAt: booking.paymentConfirmedAt,
      paymentMethod: booking.paymentMethodId,
      canPay,
      cannotPayReason,
    };
  }

  private canCancel(booking: SimpleBookingDocument): { canCancel: boolean; reason?: string } {
    const nonCancellableStatuses = [
      BookingStatus.ON_TRIP,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
    ];

    if (nonCancellableStatuses.includes(booking.status)) {
      const reasonMap: Record<string, string> = {
        [BookingStatus.ON_TRIP]: 'Trip is already in progress',
        [BookingStatus.COMPLETED]: 'Trip has been completed',
        [BookingStatus.CANCELLED_BY_USER]: 'Booking is already cancelled',
        [BookingStatus.CANCELLED_BY_OPS]: 'Booking is already cancelled',
      };
      return { canCancel: false, reason: reasonMap[booking.status] };
    }

    return { canCancel: true };
  }

  private getCancellationPolicy(booking: SimpleBookingDocument): string {
    const now = new Date();
    const hoursUntilPickup = (booking.pickupAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilPickup >= 24) {
      return 'Free cancellation available. Full refund if cancelled now.';
    } else if (hoursUntilPickup >= 2) {
      return '50% refund if cancelled now (less than 24 hours before pickup).';
    } else if (hoursUntilPickup > 0) {
      return 'No refund available (less than 2 hours before pickup).';
    } else {
      return 'Pickup time has passed.';
    }
  }

  private mapToCustomerResponse(
    booking: SimpleBookingDocument,
    driverInfo?: CustomerDriverDto,
  ): CustomerBookingResponseDto {
    const cancelInfo = this.canCancel(booking);
    
    // Map events to customer-friendly timeline
    const timeline: CustomerBookingEventDto[] = (booking.events || [])
      .filter(e => !['driver_unassigned', 'booking_updated'].includes(e.event)) // Filter internal events
      .map(e => ({
        event: e.event,
        status: e.status,
        timestamp: e.timestamp,
        description: this.getCustomerFriendlyEventDescription(e),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Latest first

    return {
      bookingId: booking.bookingId,
      accessCode: booking.accessCode || '',
      status: booking.status,
      statusDisplay: this.getStatusDisplay(booking.status),
      statusMessage: this.getStatusMessage(booking.status, !!booking.assignedDriver),
      
      passenger: {
        firstName: booking.passengerFirstName,
        lastName: booking.passengerLastName,
        phone: booking.passengerPhone,
        email: booking.passengerEmail,
      },
      
      origin: {
        type: booking.originType,
        name: booking.originName,
        address: booking.originAddress,
        latitude: booking.originLatitude,
        longitude: booking.originLongitude,
        airportCode: booking.originAirportCode,
        terminal: booking.originTerminal,
      },
      
      destination: {
        type: booking.destinationType,
        name: booking.destinationName,
        address: booking.destinationAddress,
        latitude: booking.destinationLatitude,
        longitude: booking.destinationLongitude,
        airportCode: booking.destinationAirportCode,
        terminal: booking.destinationTerminal,
      },
      
      pickupAt: booking.pickupAt,
      flightNumber: booking.flightNumber,
      passengers: booking.passengers,
      luggage: booking.luggage,
      extras: booking.extras,
      signText: booking.signText,
      notes: booking.notes,
      
      vehicle: {
        class: booking.vehicleClass,
        name: booking.vehicleName,
        capacity: booking.vehicleCapacity,
        luggageCapacity: booking.vehicleBagCapacity,
      },
      
      pricing: {
        baseFare: booking.baseFare,
        distanceCharge: booking.distanceCharge,
        airportFees: booking.airportFees,
        surcharges: booking.surcharges,
        extrasTotal: booking.extrasTotal,
        total: booking.total,
        currency: booking.currency,
      },
      
      payment: this.getPaymentStatus(booking),
      driver: driverInfo,
      timeline,
      
      canCancel: cancelInfo.canCancel,
      cannotCancelReason: cancelInfo.reason,
      cancellationPolicy: this.getCancellationPolicy(booking),
      
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private getCustomerFriendlyEventDescription(event: any): string {
    const eventDescriptions: Record<string, string> = {
      'created': 'Booking created',
      'payment_success': 'Payment confirmed',
      'payment_failed': 'Payment failed',
      'payment_initiated': 'Payment initiated',
      'driver_assigned': 'Driver assigned to your booking',
      'driver_accepted': 'Driver accepted your booking',
      'driver_declined': 'Finding a new driver',
      'driver_en_route': 'Driver is on the way',
      'driver_arrived': 'Driver has arrived',
      'driver_waiting': 'Driver is waiting',
      'driver_on_trip': 'Trip started',
      'driver_completed': 'Trip completed',
      'cancelled': 'Booking cancelled',
      'status_update': 'Booking updated',
    };
    
    return eventDescriptions[event.event] || event.description || 'Booking updated';
  }
}

