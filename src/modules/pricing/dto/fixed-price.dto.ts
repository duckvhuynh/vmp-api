import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, IsDateString, IsMongoId, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VehicleClass } from '../schemas/base-price.schema';
import { RegionInfoDto, VehicleInfoDto } from './base-price.dto';

// ============ Vehicle Fixed Pricing DTOs ============

export class VehicleFixedPricingDto {
  @ApiProperty({ description: 'Vehicle ID from vehicles collection' })
  @IsNotEmpty()
  @IsMongoId()
  vehicleId!: string;

  @ApiProperty({ description: 'Fixed price amount', example: 85.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  fixedPrice!: number;

  @ApiPropertyOptional({ description: 'Included waiting time in minutes', example: 15, default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : 15)
  includedWaitingTime?: number;

  @ApiPropertyOptional({ description: 'Price per additional minute of waiting', example: 1.50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  additionalWaitingPrice?: number;
}

// ============ Create DTOs ============

export class CreateFixedPriceDto {
  @ApiProperty({ description: 'Origin region ID' })
  @IsNotEmpty()
  @IsMongoId()
  originRegionId!: string;

  @ApiProperty({ description: 'Destination region ID' })
  @IsNotEmpty()
  @IsMongoId()
  destinationRegionId!: string;

  @ApiProperty({ description: 'Route name', example: 'Airport to Downtown' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ description: 'Currency code', example: 'MUR' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency!: string;

  @ApiProperty({ 
    description: 'Vehicle pricing configurations - array of vehicles with their fixed prices',
    type: [VehicleFixedPricingDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleFixedPricingDto)
  vehiclePrices!: VehicleFixedPricingDto[];

  @ApiPropertyOptional({ description: 'Estimated distance in kilometers', example: 25.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  estimatedDistance?: number;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes', example: 35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Whether this fixed price is active', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Priority for overlapping routes (higher = more priority)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Route description and special notes' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Tags for route categorization', 
    example: ['airport', 'popular'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];
}

export class UpdateFixedPriceDto extends PartialType(CreateFixedPriceDto) {
  @ApiPropertyOptional({ description: 'Origin region ID' })
  @IsOptional()
  @IsMongoId()
  originRegionId?: string;

  @ApiPropertyOptional({ description: 'Destination region ID' })
  @IsOptional()
  @IsMongoId()
  destinationRegionId?: string;

  @ApiPropertyOptional({ 
    description: 'Vehicle pricing configurations',
    type: [VehicleFixedPricingDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleFixedPricingDto)
  vehiclePrices?: VehicleFixedPricingDto[];
}

// ============ Response DTOs ============

export class VehicleFixedPricingResponseDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId!: string;

  @ApiPropertyOptional({ description: 'Vehicle details', type: VehicleInfoDto })
  vehicle?: VehicleInfoDto;

  @ApiProperty({ description: 'Fixed price amount' })
  fixedPrice!: number;

  @ApiProperty({ description: 'Included waiting time in minutes' })
  includedWaitingTime!: number;

  @ApiPropertyOptional({ description: 'Additional waiting price per minute' })
  additionalWaitingPrice?: number;
}

export class FixedPriceResponseDto {
  @ApiProperty({ description: 'Fixed price ID' })
  _id!: string;

  @ApiProperty({ description: 'Origin region ID' })
  originRegionId!: string;

  @ApiPropertyOptional({ description: 'Origin region details', type: RegionInfoDto })
  originRegion?: RegionInfoDto;

  @ApiProperty({ description: 'Destination region ID' })
  destinationRegionId!: string;

  @ApiPropertyOptional({ description: 'Destination region details', type: RegionInfoDto })
  destinationRegion?: RegionInfoDto;

  @ApiProperty({ description: 'Route name' })
  name!: string;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Vehicle pricing configurations', type: [VehicleFixedPricingResponseDto] })
  vehiclePrices!: VehicleFixedPricingResponseDto[];

  @ApiPropertyOptional({ description: 'Estimated distance' })
  estimatedDistance?: number;

  @ApiPropertyOptional({ description: 'Estimated duration' })
  estimatedDuration?: number;

  @ApiProperty({ description: 'Whether active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Priority' })
  priority!: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Tags', type: [String] })
  tags!: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ enum: VehicleClass, description: 'Vehicle class (deprecated)' })
  vehicleClass?: VehicleClass;

  @ApiPropertyOptional({ description: 'Fixed price (deprecated - use vehiclePrices)' })
  fixedPrice?: number;

  @ApiPropertyOptional({ description: 'Included waiting time (deprecated)' })
  includedWaitingTime?: number;

  @ApiPropertyOptional({ description: 'Additional waiting price (deprecated)' })
  additionalWaitingPrice?: number;
}

export class FixedPriceListResponseDto {
  @ApiProperty({ type: [FixedPriceResponseDto] })
  data!: FixedPriceResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
