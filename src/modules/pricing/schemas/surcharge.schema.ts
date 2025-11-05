import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SurchargeDocument = Surcharge & Document;

export enum SurchargeType {
  CUTOFF_TIME = 'cutoff_time',
  TIME_LEFT = 'time_left',
  DATETIME = 'datetime'
}

export enum SurchargeApplication {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

@Schema({ _id: false })
export class TimeRange {
  @ApiProperty({ description: 'Start time in HH:mm format', example: '22:00' })
  @Prop({ type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '06:00' })
  @Prop({ type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ })
  endTime!: string;
}

@Schema({ _id: false })
export class DateTimeRange {
  @ApiProperty({ description: 'Start date and time' })
  @Prop({ type: Date, required: true })
  startDateTime!: Date;

  @ApiProperty({ description: 'End date and time' })
  @Prop({ type: Date, required: true })
  endDateTime!: Date;
}

@Schema({ timestamps: true })
export class Surcharge {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Reference to price region' })
  @Prop({ type: Types.ObjectId, ref: 'PriceRegion', required: true })
  regionId!: Types.ObjectId;

  @ApiProperty({ description: 'Surcharge name', example: 'Night time surcharge' })
  @Prop({ required: true, trim: true })
  name!: string;

  @ApiProperty({ enum: SurchargeType, description: 'Type of surcharge' })
  @Prop({ type: String, enum: SurchargeType, required: true })
  type!: SurchargeType;

  @ApiProperty({ enum: SurchargeApplication, description: 'How surcharge is applied' })
  @Prop({ type: String, enum: SurchargeApplication, required: true })
  application!: SurchargeApplication;

  @ApiProperty({ description: 'Surcharge value (percentage or fixed amount)', example: 25.0 })
  @Prop({ type: Number, required: true, min: 0 })
  value!: number;

  @ApiProperty({ description: 'Currency code for fixed amount surcharges', example: 'AED' })
  @Prop({ 
    type: String, 
    uppercase: true, 
    length: 3
  })
  currency?: string;

  // For cutoff time surcharges (e.g., bookings made less than 2 hours before pickup)
  @ApiProperty({ 
    description: 'Cutoff time in minutes before pickup',
    example: 120,
    required: false
  })
  @Prop({ 
    type: Number, 
    min: 0
  })
  cutoffMinutes?: number;

  // For time left surcharges (e.g., booking for next 30 minutes)
  @ApiProperty({ 
    description: 'Time left threshold in minutes',
    example: 30,
    required: false
  })
  @Prop({ 
    type: Number, 
    min: 0
  })
  timeLeftMinutes?: number;

  // For time-based surcharges (e.g., night time, rush hour)
  @ApiProperty({ 
    description: 'Time range for recurring daily surcharge',
    required: false
  })
  @Prop({ 
    type: TimeRange
  })
  timeRange?: TimeRange;

  // For specific date/time surcharges (e.g., special events, holidays)
  @ApiProperty({ 
    description: 'Specific date and time range for surcharge',
    required: false
  })
  @Prop({ 
    type: DateTimeRange
  })
  dateTimeRange?: DateTimeRange;

  @ApiProperty({ description: 'Days of week (0=Sunday, 6=Saturday)', example: [1, 2, 3, 4, 5] })
  @Prop({ type: [Number], min: 0, max: 6 })
  daysOfWeek?: number[];

  @ApiProperty({ description: 'Whether surcharge is active', default: true })
  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Priority for overlapping surcharges (higher = more priority)', default: 0 })
  @Prop({ type: Number, default: 0 })
  priority!: number;

  @ApiProperty({ description: 'Valid from date' })
  @Prop({ type: Date })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  @Prop({ type: Date })
  validUntil?: Date;

  @ApiProperty({ description: 'Surcharge description' })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export const SurchargeSchema = SchemaFactory.createForClass(Surcharge);

// Create indexes for efficient queries
SurchargeSchema.index({ regionId: 1, type: 1 });
SurchargeSchema.index({ regionId: 1, isActive: 1 });
SurchargeSchema.index({ priority: -1 });
