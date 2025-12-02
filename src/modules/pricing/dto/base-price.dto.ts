import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, IsDateString, IsMongoId, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VehicleClass } from '../schemas/base-price.schema';

// ============ Vehicle Pricing DTOs ============

export class VehiclePricingDto {
  @ApiProperty({ description: 'Vehicle ID from vehicles collection' })
  @IsNotEmpty()
  @IsMongoId()
  vehicleId!: string;

  @ApiProperty({ description: 'Base fare amount', example: 25.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  baseFare!: number;

  @ApiProperty({ description: 'Price per kilometer', example: 2.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  pricePerKm!: number;

  @ApiProperty({ description: 'Price per minute', example: 0.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  pricePerMinute!: number;

  @ApiProperty({ description: 'Minimum fare amount', example: 15.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minimumFare!: number;
}

// ============ Create DTOs ============

export class CreateBasePriceDto {
  @ApiProperty({ description: 'Price region ID' })
  @IsNotEmpty()
  @IsMongoId()
  regionId!: string;

  @ApiProperty({ description: 'Currency code', example: 'MUR' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency!: string;

  @ApiProperty({ 
    description: 'Vehicle pricing configurations - array of vehicles with their prices',
    type: [VehiclePricingDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehiclePricingDto)
  vehiclePrices!: VehiclePricingDto[];

  @ApiPropertyOptional({ description: 'Whether this base price is active', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateBasePriceDto extends PartialType(CreateBasePriceDto) {
  @ApiPropertyOptional({ description: 'Price region ID' })
  @IsOptional()
  @IsMongoId()
  regionId?: string;

  @ApiPropertyOptional({ 
    description: 'Vehicle pricing configurations',
    type: [VehiclePricingDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehiclePricingDto)
  vehiclePrices?: VehiclePricingDto[];
}

// ============ Response DTOs ============

export class RegionInfoDto {
  @ApiProperty({ description: 'Region ID' })
  _id!: string;

  @ApiProperty({ description: 'Region name' })
  name!: string;

  @ApiProperty({ description: 'Region tags', type: [String] })
  tags!: string[];
}

export class VehicleInfoDto {
  @ApiProperty({ description: 'Vehicle ID' })
  _id!: string;

  @ApiProperty({ description: 'Vehicle name' })
  name!: string;

  @ApiProperty({ description: 'Vehicle category' })
  category!: string;

  @ApiPropertyOptional({ description: 'Vehicle image' })
  image?: string;

  @ApiProperty({ description: 'Max passengers' })
  maxPassengers!: number;

  @ApiProperty({ description: 'Max luggage' })
  maxLuggage!: number;
}

export class VehiclePricingResponseDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId!: string;

  @ApiPropertyOptional({ description: 'Vehicle details', type: VehicleInfoDto })
  vehicle?: VehicleInfoDto;

  @ApiProperty({ description: 'Base fare amount' })
  baseFare!: number;

  @ApiProperty({ description: 'Price per kilometer' })
  pricePerKm!: number;

  @ApiProperty({ description: 'Price per minute' })
  pricePerMinute!: number;

  @ApiProperty({ description: 'Minimum fare amount' })
  minimumFare!: number;
}

export class BasePriceResponseDto {
  @ApiProperty({ description: 'Base price ID' })
  _id!: string;

  @ApiProperty({ description: 'Price region ID' })
  regionId!: string;

  @ApiPropertyOptional({ description: 'Region details', type: RegionInfoDto })
  region?: RegionInfoDto;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Vehicle pricing configurations', type: [VehiclePricingResponseDto] })
  vehiclePrices!: VehiclePricingResponseDto[];

  @ApiProperty({ description: 'Whether this base price is active' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ enum: VehicleClass, description: 'Vehicle class (deprecated)' })
  vehicleClass?: VehicleClass;

  @ApiPropertyOptional({ description: 'Base fare (deprecated - use vehiclePrices)' })
  baseFare?: number;

  @ApiPropertyOptional({ description: 'Price per km (deprecated - use vehiclePrices)' })
  pricePerKm?: number;

  @ApiPropertyOptional({ description: 'Price per minute (deprecated - use vehiclePrices)' })
  pricePerMinute?: number;

  @ApiPropertyOptional({ description: 'Minimum fare (deprecated - use vehiclePrices)' })
  minimumFare?: number;
}

export class BasePriceListResponseDto {
  @ApiProperty({ type: [BasePriceResponseDto] })
  data!: BasePriceResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
