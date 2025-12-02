import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type BasePriceDocument = BasePrice & Document;

// Keep VehicleClass enum for backward compatibility
export enum VehicleClass {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  VAN = 'van',
  LUXURY = 'luxury'
}

// Embedded schema for individual vehicle pricing
@Schema({ _id: false })
export class VehiclePricing {
  @ApiProperty({ description: 'Vehicle ID from vehicles collection' })
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId!: Types.ObjectId;

  @ApiProperty({ description: 'Base fare amount', example: 25.00 })
  @Prop({ type: Number, required: true, min: 0 })
  baseFare!: number;

  @ApiProperty({ description: 'Price per kilometer', example: 2.50 })
  @Prop({ type: Number, required: true, min: 0 })
  pricePerKm!: number;

  @ApiProperty({ description: 'Price per minute', example: 0.75 })
  @Prop({ type: Number, required: true, min: 0 })
  pricePerMinute!: number;

  @ApiProperty({ description: 'Minimum fare amount', example: 15.00 })
  @Prop({ type: Number, required: true, min: 0 })
  minimumFare!: number;
}

export const VehiclePricingSchema = SchemaFactory.createForClass(VehiclePricing);

@Schema({ timestamps: true })
export class BasePrice {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Reference to price region' })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion', required: true })
  regionId!: Types.ObjectId;

  @ApiProperty({ description: 'Currency code', example: 'MUR' })
  @Prop({ type: String, required: true, uppercase: true, length: 3 })
  currency!: string;

  @ApiProperty({ description: 'Vehicle pricing configurations', type: [VehiclePricing] })
  @Prop({ type: [VehiclePricingSchema], required: true, default: [] })
  vehiclePrices!: VehiclePricing[];

  // Legacy field - kept for backward compatibility, will be deprecated
  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class (deprecated - use vehiclePrices instead)' })
  @Prop({ type: String, enum: VehicleClass, required: false })
  vehicleClass?: VehicleClass;

  // Legacy fields - kept for backward compatibility
  @ApiProperty({ description: 'Base fare amount (deprecated - use vehiclePrices instead)' })
  @Prop({ type: Number, min: 0 })
  baseFare?: number;

  @ApiProperty({ description: 'Price per kilometer (deprecated - use vehiclePrices instead)' })
  @Prop({ type: Number, min: 0 })
  pricePerKm?: number;

  @ApiProperty({ description: 'Price per minute (deprecated - use vehiclePrices instead)' })
  @Prop({ type: Number, min: 0 })
  pricePerMinute?: number;

  @ApiProperty({ description: 'Minimum fare amount (deprecated - use vehiclePrices instead)' })
  @Prop({ type: Number, min: 0 })
  minimumFare?: number;

  @ApiProperty({ description: 'Whether this base price is active', default: true })
  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Valid from date' })
  @Prop({ type: Date })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  @Prop({ type: Date })
  validUntil?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export const BasePriceSchema = SchemaFactory.createForClass(BasePrice);

// Create indexes for efficient queries
BasePriceSchema.index({ regionId: 1, isActive: 1 });
BasePriceSchema.index({ regionId: 1, 'vehiclePrices.vehicleId': 1 });
// Legacy index
BasePriceSchema.index({ regionId: 1, vehicleClass: 1 });
