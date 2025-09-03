import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type BasePriceDocument = BasePrice & Document;

export enum VehicleClass {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  VAN = 'van',
  LUXURY = 'luxury'
}

@Schema({ timestamps: true })
export class BasePrice {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Reference to price region' })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion', required: true })
  regionId!: Types.ObjectId;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  @Prop({ type: String, enum: VehicleClass, required: true })
  vehicleClass!: VehicleClass;

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

  @ApiProperty({ description: 'Currency code', example: 'AED' })
  @Prop({ type: String, required: true, uppercase: true, length: 3 })
  currency!: string;

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

// Create compound index for efficient queries
BasePriceSchema.index({ regionId: 1, vehicleClass: 1 });
BasePriceSchema.index({ regionId: 1, isActive: 1 });
