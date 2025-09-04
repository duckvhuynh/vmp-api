import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleClass } from '../../pricing/schemas/base-price.schema';

export type QuoteDocument = Quote & Document;

@Schema()
export class PlaceInfo {
  @ApiProperty({ enum: ['airport', 'address'] })
  @Prop({ type: String, enum: ['airport', 'address'], required: true })
  type!: 'airport' | 'address';

  @ApiProperty({ required: false })
  @Prop({ type: String })
  airportCode?: string;

  @ApiProperty({ required: false })
  @Prop({ type: String })
  terminal?: string;

  @ApiProperty({ required: false })
  @Prop({ type: String })
  address?: string;

  @ApiProperty({ required: false })
  @Prop({ type: Number })
  latitude?: number;

  @ApiProperty({ required: false })
  @Prop({ type: Number })
  longitude?: number;

  @ApiProperty({ required: false })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion' })
  regionId?: Types.ObjectId;

  @ApiProperty({ required: false })
  @Prop({ type: String })
  name?: string;
}

@Schema()
export class QuotePriceBreakdown {
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
  total!: number;

  @Prop({ type: String, required: true })
  currency!: string;
}

@Schema()
export class QuoteSurchargeDetail {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  application!: string;

  @Prop({ type: Number, required: true })
  value!: number;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: String })
  reason?: string;
}

@Schema()
export class QuoteVehicleOption {
  @Prop({ type: String, enum: VehicleClass, required: true })
  vehicleClass!: VehicleClass;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  paxCapacity!: number;

  @Prop({ type: Number, required: true })
  bagCapacity!: number;

  @Prop({ type: QuotePriceBreakdown, required: true })
  pricing!: QuotePriceBreakdown;

  @Prop({ type: [QuoteSurchargeDetail] })
  appliedSurcharges?: QuoteSurchargeDetail[];

  @Prop({ type: Number })
  includedWaitingTime?: number;

  @Prop({ type: Number })
  additionalWaitingPrice?: number;

  @Prop({ type: Boolean })
  isFixedPrice?: boolean;
}

@Schema()
export class QuotePolicy {
  @Prop({ type: String, required: true })
  cancellation!: string;

  @Prop({ type: String, required: true })
  includedWait!: string;

  @Prop({ type: String })
  additionalWaitCharge?: string;

  @Prop({ type: Date })
  quoteExpiresAt?: Date;
}

@Schema({ timestamps: true })
export class Quote {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Unique quote identifier' })
  @Prop({ type: String, required: true, unique: true, index: true })
  quoteId!: string;

  @ApiProperty({ type: PlaceInfo })
  @Prop({ type: PlaceInfo, required: true })
  origin!: PlaceInfo;

  @ApiProperty({ type: PlaceInfo })
  @Prop({ type: PlaceInfo, required: true })
  destination!: PlaceInfo;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  pickupAt!: Date;

  @ApiProperty()
  @Prop({ type: Number, required: true, min: 1 })
  passengers!: number;

  @ApiProperty()
  @Prop({ type: Number, required: true, min: 0 })
  luggage!: number;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  extras!: string[];

  @ApiProperty({ type: [QuoteVehicleOption] })
  @Prop({ type: [QuoteVehicleOption], required: true })
  vehicleOptions!: QuoteVehicleOption[];

  @ApiProperty({ type: QuotePolicy })
  @Prop({ type: QuotePolicy, required: true })
  policy!: QuotePolicy;

  @ApiProperty({ required: false })
  @Prop({ type: Number })
  estimatedDistance?: number;

  @ApiProperty({ required: false })
  @Prop({ type: Number })
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @Prop({ type: String })
  originName?: string;

  @ApiProperty({ required: false })
  @Prop({ type: String })
  destinationName?: string;

  @ApiProperty({ description: 'Quote expiration timestamp' })
  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @ApiProperty({ description: 'Whether quote has been used for booking' })
  @Prop({ type: Boolean, default: false })
  isUsed!: boolean;

  @ApiProperty({ description: 'Booking ID if quote was used' })
  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// Create indexes for efficient queries
QuoteSchema.index({ quoteId: 1 });
QuoteSchema.index({ expiresAt: 1 });
QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ isUsed: 1 });

// TTL index to automatically delete expired quotes
QuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
