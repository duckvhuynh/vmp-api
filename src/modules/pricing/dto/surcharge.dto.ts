import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max, IsDateString, IsMongoId, IsArray, ValidateNested, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SurchargeType, SurchargeApplication } from '../schemas/surcharge.schema';

export class TimeRangeDto {
  @ApiProperty({ description: 'Start time in HH:mm format', example: '22:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Start time must be in HH:mm format (24-hour)' 
  })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '06:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'End time must be in HH:mm format (24-hour)' 
  })
  endTime!: string;
}

export class DateTimeRangeDto {
  @ApiProperty({ description: 'Start date and time' })
  @IsDateString()
  startDateTime!: string;

  @ApiProperty({ description: 'End date and time' })
  @IsDateString()
  endDateTime!: string;
}

export class CreateSurchargeDto {
  @ApiProperty({ description: 'Price region ID' })
  @IsNotEmpty()
  @IsMongoId()
  regionId!: string;

  @ApiProperty({ description: 'Surcharge name', example: 'Night time surcharge' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ enum: SurchargeType, description: 'Type of surcharge' })
  @IsEnum(SurchargeType)
  type!: SurchargeType;

  @ApiProperty({ enum: SurchargeApplication, description: 'How surcharge is applied' })
  @IsEnum(SurchargeApplication)
  application!: SurchargeApplication;

  @ApiProperty({ description: 'Surcharge value (percentage or fixed amount)', example: 25.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  value!: number;

  @ApiProperty({ description: 'Currency code for fixed amount surcharges', example: 'AED', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @ApiProperty({ 
    description: 'Cutoff time in minutes before pickup (for cutoff_time type)',
    example: 120,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  cutoffMinutes?: number;

  @ApiProperty({ 
    description: 'Time left threshold in minutes (for time_left type)',
    example: 30,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  timeLeftMinutes?: number;

  @ApiProperty({ 
    description: 'Time range for recurring daily surcharge',
    required: false,
    type: TimeRangeDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRangeDto)
  timeRange?: TimeRangeDto;

  @ApiProperty({ 
    description: 'Specific date and time range for surcharge',
    required: false,
    type: DateTimeRangeDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateTimeRangeDto)
  dateTimeRange?: DateTimeRangeDto;

  @ApiProperty({ 
    description: 'Days of week (0=Sunday, 6=Saturday)', 
    example: [1, 2, 3, 4, 5],
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Transform(({ value }) => value?.map((day: any) => parseInt(day)))
  daysOfWeek?: number[];

  @ApiProperty({ description: 'Whether surcharge is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({ description: 'Priority for overlapping surcharges (higher = more priority)', default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  priority?: number;

  @ApiProperty({ description: 'Valid from date', required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ description: 'Valid until date', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ description: 'Surcharge description', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}

export class UpdateSurchargeDto extends PartialType(CreateSurchargeDto) {
  @ApiProperty({ description: 'Price region ID', required: false })
  @IsOptional()
  @IsMongoId()
  regionId?: string;
}

export class SurchargeResponseDto {
  @ApiProperty({ description: 'Surcharge ID' })
  _id!: string;

  @ApiProperty({ description: 'Price region ID' })
  regionId!: string;

  @ApiProperty({ description: 'Surcharge name' })
  name!: string;

  @ApiProperty({ enum: SurchargeType, description: 'Type of surcharge' })
  type!: SurchargeType;

  @ApiProperty({ enum: SurchargeApplication, description: 'How surcharge is applied' })
  application!: SurchargeApplication;

  @ApiProperty({ description: 'Surcharge value' })
  value!: number;

  @ApiProperty({ description: 'Currency code' })
  currency?: string;

  @ApiProperty({ description: 'Cutoff time in minutes' })
  cutoffMinutes?: number;

  @ApiProperty({ description: 'Time left threshold in minutes' })
  timeLeftMinutes?: number;

  @ApiProperty({ description: 'Time range' })
  timeRange?: TimeRangeDto;

  @ApiProperty({ description: 'Date and time range' })
  dateTimeRange?: DateTimeRangeDto;

  @ApiProperty({ description: 'Days of week' })
  daysOfWeek?: number[];

  @ApiProperty({ description: 'Whether surcharge is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Priority' })
  priority!: number;

  @ApiProperty({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiProperty({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export class SurchargeListResponseDto {
  @ApiProperty({ type: [SurchargeResponseDto] })
  data!: SurchargeResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
