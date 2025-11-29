import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SimpleBookingDocument = SimpleBooking & Document;

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  DRIVER_ASSIGNED = 'driver_assigned',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  WAITING = 'waiting',
  NO_SHOW = 'no_show',
  ON_TRIP = 'on_trip',
  COMPLETED = 'completed',
  CANCELLED_BY_USER = 'cancelled_by_user',
  CANCELLED_BY_OPS = 'cancelled_by_ops',
  PAYMENT_FAILED = 'payment_failed',
  DRIVER_DECLINED = 'driver_declined',
}

export enum BookingEventName {
  CREATED = 'created',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_ACCEPTED = 'driver_accepted',
  DRIVER_DECLINED = 'driver_declined',
  DRIVER_EN_ROUTE = 'driver_en_route',
  DRIVER_ARRIVED = 'driver_arrived',
  DRIVER_WAITING = 'driver_waiting',
  DRIVER_ON_TRIP = 'driver_on_trip',
  DRIVER_COMPLETED = 'driver_completed',
  CANCELLED = 'cancelled',
  STATUS_UPDATE = 'status_update',
}

@Schema()
export class SimpleBooking {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  bookingId!: string;

  @Prop({ type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING_PAYMENT })
  status!: BookingStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  passengerFirstName!: string;

  @Prop({ type: String, required: true })
  passengerLastName!: string;

  @Prop({ type: String, required: true })
  passengerPhone!: string;

  // Origin fields
  @Prop({ type: String, enum: ['airport', 'address', 'hotel', 'port'], default: 'address' })
  originType?: string;

  @Prop({ type: String })
  originAirportCode?: string;

  @Prop({ type: String })
  originTerminal?: string;

  @Prop({ type: String })
  originName?: string;

  @Prop({ type: String })
  originAddress?: string;

  @Prop({ type: Number })
  originLatitude?: number;

  @Prop({ type: Number })
  originLongitude?: number;

  @Prop({ type: Types.ObjectId, ref: 'PriceRegion' })
  originRegionId?: Types.ObjectId;

  // Destination fields
  @Prop({ type: String, enum: ['airport', 'address', 'hotel', 'port'], default: 'address' })
  destinationType?: string;

  @Prop({ type: String })
  destinationAirportCode?: string;

  @Prop({ type: String })
  destinationTerminal?: string;

  @Prop({ type: String })
  destinationName?: string;

  @Prop({ type: String })
  destinationAddress?: string;

  @Prop({ type: Number })
  destinationLatitude?: number;

  @Prop({ type: Number })
  destinationLongitude?: number;

  @Prop({ type: Types.ObjectId, ref: 'PriceRegion' })
  destinationRegionId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  pickupAt!: Date;

  @Prop({ type: Date })
  actualPickupAt?: Date;

  @Prop({ type: Date })
  actualDropoffAt?: Date;

  @Prop({ type: Number, required: true, min: 1 })
  passengers!: number;

  @Prop({ type: Number, required: true, min: 0 })
  luggage!: number;

  @Prop({ type: [String], default: [] })
  extras!: string[];

  @Prop({ type: String })
  vehicleClass!: string;

  @Prop({ type: String })
  vehicleName!: string;

  @Prop({ type: Number })
  vehicleCapacity!: number;

  @Prop({ type: Number })
  vehicleBagCapacity!: number;

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
  extrasTotal?: number;

  @Prop({ type: Number, required: true })
  total!: number;

  @Prop({ type: String, required: true })
  currency!: string;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  assignedDriver?: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  events!: any[];

  @Prop({ type: Date })
  paymentConfirmedAt?: Date;

  @Prop({ type: String })
  paymentIntentId?: string;

  @Prop({ type: String })
  paymentMethodId?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const SimpleBookingSchema = SchemaFactory.createForClass(SimpleBooking);

// Create indexes for efficient queries
SimpleBookingSchema.index({ bookingId: 1 }, { unique: true });
SimpleBookingSchema.index({ userId: 1 });
SimpleBookingSchema.index({ assignedDriver: 1 });
SimpleBookingSchema.index({ status: 1 });
SimpleBookingSchema.index({ originLatitude: 1, originLongitude: 1 });
SimpleBookingSchema.index({ destinationLatitude: 1, destinationLongitude: 1 });
