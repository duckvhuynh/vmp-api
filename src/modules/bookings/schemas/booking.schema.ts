import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_ACCEPTED = 'driver_accepted',
  DRIVER_DECLINED = 'driver_declined',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  WAITING = 'waiting',
  NO_SHOW = 'no_show',
  ON_TRIP = 'on_trip',
  COMPLETED = 'completed',
  CANCELLED_BY_USER = 'cancelled_by_user',
  CANCELLED_BY_DRIVER = 'cancelled_by_driver',
  CANCELLED_BY_OPS = 'cancelled_by_ops',
  PAYMENT_FAILED = 'payment_failed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Schema()
export class BookingLocation {
  @Prop({ type: String, required: true })
  type!: 'airport' | 'address';

  @Prop({ type: String })
  airportCode?: string;

  @Prop({ type: String })
  terminal?: string;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: Number, required: true })
  latitude!: number;

  @Prop({ type: Number, required: true })
  longitude!: number;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  instructions?: string;
}

@Schema()
export class BookingPassenger {
  @Prop({ type: String, required: true })
  firstName!: string;

  @Prop({ type: String, required: true })
  lastName!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({ type: String, required: true })
  phone!: string;

  @Prop({ type: String })
  signText?: string;

  @Prop({ type: String })
  notes?: string;
}

@Schema()
export class BookingFlight {
  @Prop({ type: String, required: true })
  flightNumber!: string;

  @Prop({ type: String, required: true })
  airline!: string;

  @Prop({ type: Date, required: true })
  scheduledArrival!: Date;

  @Prop({ type: Date })
  actualArrival?: Date;

  @Prop({ type: String })
  terminal?: string;

  @Prop({ type: String })
  gate?: string;

  @Prop({ type: String })
  baggageClaim?: string;
}

@Schema()
export class BookingPricing {
  @Prop({ type: Number, required: true })
  baseFare!: number;

  @Prop({ type: Number })
  distanceCharge?: number;

  @Prop({ type: Number })
  timeCharge?: number;

  @Prop({ type: Number })
  airportFees?: number;

  @Prop({ type: Number })
  surcharges?: number;

  @Prop({ type: Number })
  extras?: number;

  @Prop({ type: Number, required: true })
  subtotal!: number;

  @Prop({ type: Number, required: true })
  total!: number;

  @Prop({ type: String, required: true })
  currency!: string;

  @Prop({ type: String })
  pricingMethod?: string;

  @Prop({ type: Boolean, default: false })
  isFixedPrice?: boolean;
}

@Schema()
export class BookingVehicle {
  @Prop({ type: String, required: true })
  vehicleClass!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  paxCapacity!: number;

  @Prop({ type: Number, required: true })
  bagCapacity!: number;

  @Prop({ type: BookingPricing, required: true })
  pricing!: BookingPricing;
}

@Schema()
export class BookingDriver {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true })
  driverId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  driverName!: string;

  @Prop({ type: String, required: true })
  driverPhone!: string;

  @Prop({ type: String })
  driverPhoto?: string;

  @Prop({ type: String })
  vehicleMake?: string;

  @Prop({ type: String })
  vehicleModel?: string;

  @Prop({ type: String })
  vehicleColor?: string;

  @Prop({ type: String })
  licensePlate?: string;

  @Prop({ type: Number })
  driverRating?: number;

  @Prop({ type: Date })
  assignedAt?: Date;

  @Prop({ type: Date })
  acceptedAt?: Date;

  @Prop({ type: Date })
  declinedAt?: Date;

  @Prop({ type: String })
  declineReason?: string;
}

@Schema()
export class BookingEvent {
  @Prop({ type: String, required: true })
  event!: string;

  @Prop({ type: String, required: true })
  status!: string;

  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;
}

@Schema()
export class BookingRefund {
  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: String, required: true })
  currency!: string;

  @Prop({ type: String, required: true })
  reason!: string;

  @Prop({ type: Date, default: Date.now })
  processedAt!: Date;

  @Prop({ type: String })
  refundId?: string;

  @Prop({ type: String })
  status?: string;
}

@Schema({ timestamps: true })
export class Booking {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  bookingId!: string;

  @Prop({ type: String, required: true })
  quoteId!: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING_PAYMENT })
  status!: BookingStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;

  @Prop({ type: BookingLocation, required: true })
  origin!: BookingLocation;

  @Prop({ type: BookingLocation, required: true })
  destination!: BookingLocation;

  @Prop({ type: Date, required: true })
  pickupAt!: Date;

  @Prop({ type: Date })
  actualPickupAt?: Date;

  @Prop({ type: Date })
  dropoffAt?: Date;

  @Prop({ type: Date })
  actualDropoffAt?: Date;

  @Prop({ type: Number, required: true })
  passengers!: number;

  @Prop({ type: Number, required: true })
  luggage!: number;

  @Prop({ type: [String] })
  extras?: string[];

  @Prop({ type: BookingPassenger, required: true })
  passenger!: BookingPassenger;

  @Prop({ type: BookingFlight })
  flight?: BookingFlight;

  @Prop({ type: BookingVehicle, required: true })
  vehicle!: BookingVehicle;

  @Prop({ type: BookingDriver })
  driver?: BookingDriver;

  @Prop({ type: [BookingEvent], default: [] })
  events!: BookingEvent[];

  @Prop({ type: BookingRefund })
  refund?: BookingRefund;

  @Prop({ type: Number })
  estimatedDistance?: number;

  @Prop({ type: Number })
  estimatedDuration?: number;

  @Prop({ type: Number })
  actualDistance?: number;

  @Prop({ type: Number })
  actualDuration?: number;

  @Prop({ type: String })
  paymentMethodId?: string;

  @Prop({ type: String })
  paymentIntentId?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  cancellationReason?: string;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Boolean, default: false })
  isRecurring!: boolean;

  @Prop({ type: String })
  recurringPattern?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Create indexes for efficient queries
BookingSchema.index({ bookingId: 1 }, { unique: true });
BookingSchema.index({ quoteId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ 'passenger.email': 1 });
BookingSchema.index({ 'passenger.phone': 1 });
BookingSchema.index({ pickupAt: 1 });
BookingSchema.index({ 'driver.driverId': 1 });
BookingSchema.index({ 'origin.latitude': 1, 'origin.longitude': 1 });
BookingSchema.index({ 'destination.latitude': 1, 'destination.longitude': 1 });
BookingSchema.index({ createdAt: 1 });
BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
BookingSchema.index({ status: 1, pickupAt: 1 });
BookingSchema.index({ 'driver.driverId': 1, status: 1 });
BookingSchema.index({ status: 1, 'origin.latitude': 1, 'origin.longitude': 1 });
