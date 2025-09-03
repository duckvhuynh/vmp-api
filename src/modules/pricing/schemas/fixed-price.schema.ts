import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleClass } from './base-price.schema';

export type FixedPriceDocument = FixedPrice & Document;

@Schema({ timestamps: true })
export class FixedPrice {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Origin region ID' })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion', required: true })
  originRegionId!: Types.ObjectId;

  @ApiProperty({ description: 'Destination region ID' })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion', required: true })
  destinationRegionId!: Types.ObjectId;

  @ApiProperty({ description: 'Route name', example: 'Dubai Airport to Downtown' })
  @Prop({ required: true, trim: true })
  name!: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  @Prop({ type: String, enum: VehicleClass, required: true })
  vehicleClass!: VehicleClass;

  @ApiProperty({ description: 'Fixed price amount', example: 85.00 })
  @Prop({ type: Number, required: true, min: 0 })
  fixedPrice!: number;

  @ApiProperty({ description: 'Currency code', example: 'AED' })
  @Prop({ type: String, required: true, uppercase: true, length: 3 })
  currency!: string;

  @ApiProperty({ description: 'Estimated distance in kilometers', example: 25.5 })
  @Prop({ type: Number, min: 0 })
  estimatedDistance?: number;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 35 })
  @Prop({ type: Number, min: 0 })
  estimatedDuration?: number;

  @ApiProperty({ description: 'Included waiting time in minutes', example: 15, default: 15 })
  @Prop({ type: Number, min: 0, default: 15 })
  includedWaitingTime!: number;

  @ApiProperty({ description: 'Price per additional minute of waiting', example: 1.50 })
  @Prop({ type: Number, min: 0 })
  additionalWaitingPrice?: number;

  @ApiProperty({ description: 'Whether this fixed price is active', default: true })
  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Priority for overlapping routes (higher = more priority)', default: 0 })
  @Prop({ type: Number, default: 0 })
  priority!: number;

  @ApiProperty({ description: 'Valid from date' })
  @Prop({ type: Date })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  @Prop({ type: Date })
  validUntil?: Date;

  @ApiProperty({ description: 'Route description and special notes' })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ description: 'Tags for route categorization', example: ['airport', 'popular'] })
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export const FixedPriceSchema = SchemaFactory.createForClass(FixedPrice);

// Create compound indexes for efficient queries
FixedPriceSchema.index({ originRegionId: 1, destinationRegionId: 1, vehicleClass: 1 });
FixedPriceSchema.index({ originRegionId: 1, destinationRegionId: 1, isActive: 1 });
FixedPriceSchema.index({ priority: -1 });
