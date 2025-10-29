import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SimpleDriverDocument = SimpleDriver & Document;

export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ON_BREAK = 'on_break',
}

export enum DriverAvailability {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  ON_TRIP = 'on_trip',
  UNAVAILABLE = 'unavailable',
}

@Schema()
export class SimpleDriver {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  driverId!: string;

  @Prop({ type: String, required: true })
  firstName!: string;

  @Prop({ type: String, required: true })
  lastName!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: String, required: true })
  phone!: string;

  @Prop({ type: String, enum: Object.values(DriverStatus), default: DriverStatus.OFFLINE })
  status!: DriverStatus;

  @Prop({ type: String, enum: Object.values(DriverAvailability), default: DriverAvailability.UNAVAILABLE })
  availability!: DriverAvailability;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String, required: true })
  vehicleMake!: string;

  @Prop({ type: String, required: true })
  vehicleModel!: string;

  @Prop({ type: String, required: true })
  vehicleYear!: string;

  @Prop({ type: String, required: true })
  vehicleColor!: string;

  @Prop({ type: String, required: true, unique: true })
  licensePlate!: string;

  @Prop({ type: String, required: true })
  vehicleType!: string;

  @Prop({ type: Number, required: true })
  capacity!: number;

  @Prop({ type: Number, required: true })
  luggageCapacity!: number;

  @Prop({ type: Number, default: 0 })
  totalTrips!: number;

  @Prop({ type: Number, default: 0 })
  completedTrips!: number;

  @Prop({ type: Number, default: 0 })
  cancelledTrips!: number;

  @Prop({ type: Number, default: 0 })
  totalEarnings!: number;

  @Prop({ type: Number, default: 0 })
  rating!: number;

  @Prop({ type: Number, default: 0 })
  totalRatings!: number;

  @Prop({ type: Boolean, default: false })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isVerified!: boolean;

  @Prop({ type: Date })
  lastActiveAt?: Date;

  @Prop({ type: Date })
  lastLocationUpdate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  currentBookingId?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const SimpleDriverSchema = SchemaFactory.createForClass(SimpleDriver);

// Create indexes for efficient queries
SimpleDriverSchema.index({ driverId: 1 }, { unique: true });
SimpleDriverSchema.index({ email: 1 }, { unique: true });
SimpleDriverSchema.index({ status: 1 });
SimpleDriverSchema.index({ availability: 1 });
SimpleDriverSchema.index({ latitude: 1, longitude: 1 });
SimpleDriverSchema.index({ licensePlate: 1 }, { unique: true });
SimpleDriverSchema.index({ currentBookingId: 1 });
