import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuoteDocument = Quote & Document;

// Embedded schema for vehicle option
@Schema({ _id: false })
export class QuoteVehicleOption {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId?: Types.ObjectId;

  @Prop({ required: true })
  vehicleClass!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  paxCapacity!: number;

  @Prop({ required: true })
  bagCapacity!: number;

  @Prop()
  image?: string;

  @Prop({ required: true })
  baseFare!: number;

  @Prop()
  distanceCharge?: number;

  @Prop()
  timeCharge?: number;

  @Prop()
  airportFees?: number;

  @Prop()
  surcharges?: number;

  @Prop()
  extrasTotal?: number;

  @Prop({ required: true })
  total!: number;

  @Prop({ required: true, default: 'MUR' })
  currency!: string;

  @Prop()
  isFixedPrice?: boolean;
}

// Embedded schema for place/location
@Schema({ _id: false })
export class QuotePlace {
  @Prop({ required: true, enum: ['airport', 'address', 'hotel', 'port'] })
  type!: string;

  @Prop()
  airportCode?: string;

  @Prop()
  terminal?: string;

  @Prop()
  name?: string;

  @Prop()
  address?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  regionId?: string;
}

@Schema({ timestamps: true })
export class Quote {
  @Prop({ required: true, unique: true, index: true })
  quoteId!: string;

  // Origin and Destination
  @Prop({ type: QuotePlace, required: true })
  origin!: QuotePlace;

  @Prop({ type: QuotePlace, required: true })
  destination!: QuotePlace;

  @Prop({ required: true })
  pickupAt!: Date;

  @Prop({ required: true, min: 1 })
  passengers!: number;

  @Prop({ required: true, min: 0 })
  luggage!: number;

  @Prop({ type: [String], default: [] })
  extras!: string[];

  // Vehicle options with pricing
  @Prop({ type: [QuoteVehicleOption], required: true })
  vehicleOptions!: QuoteVehicleOption[];

  // Estimated trip info
  @Prop()
  estimatedDistanceKm?: number;

  @Prop()
  estimatedDurationMinutes?: number;

  @Prop()
  originName?: string;

  @Prop()
  destinationName?: string;

  // Policy info
  @Prop()
  cancellationPolicy?: string;

  @Prop()
  waitingTimePolicy?: string;

  // Expiration
  @Prop({ required: true, index: true })
  expiresAt!: Date;

  // Usage tracking
  @Prop({ default: false })
  isUsed!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'SimpleBooking' })
  bookingId?: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// Indexes for efficient queries
QuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
QuoteSchema.index({ isUsed: 1 });
