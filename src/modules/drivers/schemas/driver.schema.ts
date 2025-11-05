import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DriverDocument = Driver & Document;

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
  ON_TRIP = 'on_trip',
  BREAK = 'break',
  SUSPENDED = 'suspended',
}

export enum DriverAvailability {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  BUSY = 'busy',
  BREAK = 'break',
}

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  VAN = 'van',
  LUXURY = 'luxury',
}

@Schema({ _id: false })
export class DriverLocation {
  @Prop({ type: Number, required: true })
  latitude!: number;

  @Prop({ type: Number, required: true })
  longitude!: number;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  @Prop({ type: Number })
  accuracy?: number;

  @Prop({ type: Number })
  heading?: number;

  @Prop({ type: Number })
  speed?: number;
}

@Schema({ _id: false })
export class DriverVehicle {
  @Prop({ type: String, required: true })
  make!: string;

  @Prop({ type: String, required: true })
  model!: string;

  @Prop({ type: String, required: true })
  year!: string;

  @Prop({ type: String, required: true })
  color!: string;

  @Prop({ type: String, required: true })
  licensePlate!: string;

  @Prop({ type: String, enum: Object.values(VehicleType), required: true })
  type!: VehicleType;

  @Prop({ type: Number, required: true })
  capacity!: number;

  @Prop({ type: Number, required: true })
  luggageCapacity!: number;

  @Prop({ type: [String] })
  features?: string[];

  @Prop({ type: String })
  imageUrl?: string;
}

@Schema({ _id: false })
export class DriverDocumentInfo {
  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: String, required: true })
  number!: string;

  @Prop({ type: Date, required: true })
  expiryDate!: Date;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: Boolean, default: false })
  isVerified!: boolean;
}

@Schema({ _id: false })
export class DriverStats {
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

  @Prop({ type: Date })
  lastTripDate?: Date;

  @Prop({ type: Number, default: 0 })
  onlineHours!: number;
}

@Schema({ timestamps: true })
export class Driver {
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

  @Prop({ type: String })
  profileImageUrl?: string;

  @Prop({ type: String, enum: DriverStatus, default: DriverStatus.OFFLINE })
  status!: DriverStatus;

  @Prop({ type: String, enum: DriverAvailability, default: DriverAvailability.UNAVAILABLE })
  availability!: DriverAvailability;

  @Prop({ type: DriverLocation })
  currentLocation?: DriverLocation;

  @Prop({ type: DriverVehicle, required: true })
  vehicle!: DriverVehicle;

  @Prop({ type: [DriverDocumentInfo] })
  documents!: DriverDocumentInfo[];

  @Prop({ type: DriverStats, default: () => ({}) })
  stats!: DriverStats;

  @Prop({ type: [String] })
  preferredRegions?: string[];

  @Prop({ type: [String] })
  workingHours?: string[];

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

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: [String] })
  tags?: string[];

}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.set('timestamps', true);

// Create indexes for efficient queries
DriverSchema.index({ driverId: 1 }, { unique: true });
DriverSchema.index({ email: 1 }, { unique: true });
DriverSchema.index({ status: 1 });
DriverSchema.index({ availability: 1 });
DriverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
DriverSchema.index({ 'vehicle.type': 1 });
DriverSchema.index({ isActive: 1, isVerified: 1 });
DriverSchema.index({ lastActiveAt: 1 });

// Geospatial index for location-based queries
DriverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 }, { 
  name: 'location_2dsphere',
  '2dsphereIndexVersion': 3 
});
