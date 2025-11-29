import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { CreateBookingDto, BookingResponseDto } from './dto/create-booking.dto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from './schemas/simple-booking.schema';
import { Quote, QuoteDocument } from '../quotes/schemas/simple-quote.schema';
import { PlaceType, getPlaceDisplayName } from '../../common/dto/place.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
  ) {}

  /**
   * Create a booking from a quote
   * Customer flow: Quote -> Select Vehicle -> Create Booking -> Payment
   */
  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    this.logger.log(`Creating booking from quote ${dto.quoteId} with vehicle class ${dto.selectedVehicleClass}`);

    // 1. Validate and fetch quote
    const quote = await this.quoteModel.findOne({ quoteId: dto.quoteId }).exec();
    if (!quote) {
      throw new NotFoundException(`Quote ${dto.quoteId} not found`);
    }

    // 2. Check if quote is still valid
    if (quote.expiresAt < new Date()) {
      throw new BadRequestException(`Quote ${dto.quoteId} has expired. Please get a new quote.`);
    }

    // 3. Check if quote is already used
    if (quote.isUsed) {
      throw new BadRequestException(`Quote ${dto.quoteId} has already been used for another booking`);
    }

    // 4. Find selected vehicle option
    const selectedVehicle = quote.vehicleOptions.find(
      v => v.vehicleClass.toLowerCase() === dto.selectedVehicleClass.toLowerCase()
    );

    if (!selectedVehicle) {
      const availableClasses = quote.vehicleOptions.map(v => v.vehicleClass).join(', ');
      throw new BadRequestException(
        `Vehicle class '${dto.selectedVehicleClass}' not available in this quote. Available: ${availableClasses}`
      );
    }

    // 5. Generate unique booking ID
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueId = randomUUID().substring(0, 6).toUpperCase();
    const bookingId = `BK-${dateStr}-${uniqueId}`;

    // 6. Create booking (userId is omitted for guest bookings)
    const booking = new this.bookingModel({
      bookingId,
      status: BookingStatus.PENDING_PAYMENT,
      // userId is not set for guest bookings - can be linked later if user logs in
      
      // Passenger info
      passengerFirstName: dto.passenger.firstName,
      passengerLastName: dto.passenger.lastName,
      passengerPhone: dto.contact.phone,
      passengerEmail: dto.contact.email,

      // Origin from quote
      originType: quote.origin.type,
      originAirportCode: quote.origin.airportCode,
      originTerminal: quote.origin.terminal,
      originName: quote.originName || quote.origin.name || quote.origin.address,
      originAddress: quote.origin.address,
      originLatitude: quote.origin.latitude,
      originLongitude: quote.origin.longitude,

      // Destination from quote
      destinationType: quote.destination.type,
      destinationAirportCode: quote.destination.airportCode,
      destinationTerminal: quote.destination.terminal,
      destinationName: quote.destinationName || quote.destination.name || quote.destination.address,
      destinationAddress: quote.destination.address,
      destinationLatitude: quote.destination.latitude,
      destinationLongitude: quote.destination.longitude,

      // Trip details
      pickupAt: quote.pickupAt,
      flightNumber: dto.flight?.number,
      flightDate: dto.flight?.date,
      passengers: quote.passengers,
      luggage: quote.luggage,
      extras: [...(quote.extras || []), ...(dto.extras || [])].filter((v, i, a) => a.indexOf(v) === i), // Merge and dedupe

      // Vehicle from selected option
      vehicleClass: selectedVehicle.vehicleClass,
      vehicleName: selectedVehicle.name,
      vehicleCapacity: selectedVehicle.paxCapacity,
      vehicleBagCapacity: selectedVehicle.bagCapacity,

      // Pricing from selected option
      baseFare: selectedVehicle.baseFare,
      distanceCharge: selectedVehicle.distanceCharge,
      timeCharge: selectedVehicle.timeCharge,
      airportFees: selectedVehicle.airportFees,
      surcharges: selectedVehicle.surcharges,
      extrasTotal: selectedVehicle.extrasTotal,
      total: selectedVehicle.total,
      currency: selectedVehicle.currency,

      // Additional info
      signText: dto.signText,
      notes: dto.notes,

      // Events
      events: [
        {
          event: BookingEventName.CREATED,
          status: BookingStatus.PENDING_PAYMENT,
          timestamp: new Date(),
          description: `Booking created from quote. Vehicle: ${selectedVehicle.name}`,
        },
      ],

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await booking.save();

    // 7. Mark quote as used
    quote.isUsed = true;
    quote.bookingId = booking._id;
    await quote.save();

    this.logger.log(`Booking ${bookingId} created successfully from quote ${dto.quoteId}`);

    // 8. Build response
    return {
      bookingId,
      status: BookingStatus.PENDING_PAYMENT,
      summary: {
        origin: quote.originName || this.getLocationDisplay(quote.origin),
        destination: quote.destinationName || this.getLocationDisplay(quote.destination),
        pickupAt: quote.pickupAt.toISOString(),
        vehicleClass: selectedVehicle.vehicleClass,
        vehicleName: selectedVehicle.name,
        passengers: quote.passengers,
        luggage: quote.luggage,
        flightNumber: dto.flight?.number,
      },
      payment: {
        amount: selectedVehicle.total,
        currency: selectedVehicle.currency,
        bookingId,
        checkoutEndpoint: '/api/v1/payments/checkout',
      },
      policySnapshot: {
        cancellation: quote.cancellationPolicy || 'Free cancellation until 24 hours before pickup',
        includedWait: quote.waitingTimePolicy || '15 minutes included',
      },
      confirmation: {
        message: 'Booking created successfully. Please complete payment to confirm.',
      },
      createdAt: timestamp.toISOString(),
      expiresAt: quote.expiresAt.toISOString(),
    };
  }

  /**
   * Get booking details
   */
  async get(id: string) {
    let booking: SimpleBookingDocument | null = null;

    // Try by bookingId first
    booking = await this.bookingModel.findOne({ bookingId: id }).exec();

    // Try by MongoDB _id
    if (!booking && Types.ObjectId.isValid(id)) {
      booking = await this.bookingModel.findById(id).exec();
    }

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return {
      bookingId: booking.bookingId,
      status: booking.status,
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
      },
      destination: {
        type: booking.destinationType,
        name: booking.destinationName,
        address: booking.destinationAddress,
        latitude: booking.destinationLatitude,
        longitude: booking.destinationLongitude,
      },
      pickupAt: booking.pickupAt,
      flightNumber: booking.flightNumber,
      passengers: booking.passengers,
      luggage: booking.luggage,
      extras: booking.extras,
      vehicle: {
        class: booking.vehicleClass,
        name: booking.vehicleName,
        capacity: booking.vehicleCapacity,
        luggageCapacity: booking.vehicleBagCapacity,
      },
      pricing: {
        baseFare: booking.baseFare,
        distanceCharge: booking.distanceCharge,
        timeCharge: booking.timeCharge,
        airportFees: booking.airportFees,
        surcharges: booking.surcharges,
        extrasTotal: booking.extrasTotal,
        total: booking.total,
        currency: booking.currency,
      },
      payment: {
        confirmed: !!booking.paymentConfirmedAt,
        confirmedAt: booking.paymentConfirmedAt,
      },
      driver: booking.assignedDriver ? {
        assigned: true,
        // TODO: Populate driver details
      } : null,
      events: booking.events,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  /**
   * Cancel booking
   */
  async cancel(id: string) {
    let booking = await this.bookingModel.findOne({ bookingId: id }).exec();

    if (!booking && Types.ObjectId.isValid(id)) {
      booking = await this.bookingModel.findById(id).exec();
    }

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    // Check if booking can be cancelled
    const nonCancellableStatuses = [
      BookingStatus.ON_TRIP,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_USER,
      BookingStatus.CANCELLED_BY_OPS,
    ];

    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel booking with status ${booking.status}`);
    }

    // Calculate refund
    let refundAmount = 0;
    const hoursUntilPickup = (booking.pickupAt.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilPickup >= 24) {
      // Full refund if cancelled 24+ hours before
      refundAmount = booking.total;
    } else if (hoursUntilPickup >= 2) {
      // 50% refund if cancelled 2-24 hours before
      refundAmount = booking.total * 0.5;
    }
    // No refund if less than 2 hours

    // Update booking
    booking.status = BookingStatus.CANCELLED_BY_USER;
    booking.updatedAt = new Date();
    booking.events.push({
      event: 'cancelled',
      status: BookingStatus.CANCELLED_BY_USER,
      timestamp: new Date(),
      description: `Booking cancelled by customer. Refund: ${refundAmount} ${booking.currency}`,
    });

    await booking.save();

    this.logger.log(`Booking ${booking.bookingId} cancelled by user`);

    return {
      bookingId: booking.bookingId,
      status: BookingStatus.CANCELLED_BY_USER,
      refund: {
        amount: refundAmount,
        currency: booking.currency,
        status: refundAmount > 0 ? 'pending' : 'none',
      },
      message: refundAmount > 0 
        ? `Booking cancelled. Refund of ${refundAmount} ${booking.currency} will be processed.`
        : 'Booking cancelled. No refund due to late cancellation.',
    };
  }

  /**
   * Helper to get location display text
   */
  private getLocationDisplay(place: any): string {
    if (place.type === 'airport' && place.airportCode) {
      return `${place.airportCode} Airport${place.terminal ? ` - ${place.terminal}` : ''}`;
    }
    return place.name || place.address || 'Unknown Location';
  }
}
