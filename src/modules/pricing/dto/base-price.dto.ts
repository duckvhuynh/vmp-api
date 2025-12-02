import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, IsDateString, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VehicleClass } from '../schemas/base-price.schema';

export class CreateBasePriceDto {
  @ApiProperty({ description: 'Price region ID' })
  @IsNotEmpty()
  @IsMongoId()
  regionId!: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  @IsEnum(VehicleClass)
  vehicleClass!: VehicleClass;

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

  @ApiProperty({ description: 'Currency code', example: 'AED' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency!: string;

  @ApiProperty({ description: 'Whether this base price is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({ description: 'Valid from date', required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ description: 'Valid until date', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateBasePriceDto extends PartialType(CreateBasePriceDto) {
  @ApiProperty({ description: 'Price region ID', required: false })
  @IsOptional()
  @IsMongoId()
  regionId?: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class', required: false })
  @IsOptional()
  @IsEnum(VehicleClass)
  vehicleClass?: VehicleClass;
}

export class RegionInfoDto {
  @ApiProperty({ description: 'Region ID' })
  _id!: string;

  @ApiProperty({ description: 'Region name' })
  name!: string;

  @ApiProperty({ description: 'Region tags', type: [String] })
  tags!: string[];
}

export class BasePriceResponseDto {
  @ApiProperty({ description: 'Base price ID' })
  _id!: string;

  @ApiProperty({ description: 'Price region ID' })
  regionId!: string;

  @ApiProperty({ description: 'Region details', type: RegionInfoDto, required: false })
  region?: RegionInfoDto;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  vehicleClass!: VehicleClass;

  @ApiProperty({ description: 'Base fare amount' })
  baseFare!: number;

  @ApiProperty({ description: 'Price per kilometer' })
  pricePerKm!: number;

  @ApiProperty({ description: 'Price per minute' })
  pricePerMinute!: number;

  @ApiProperty({ description: 'Minimum fare amount' })
  minimumFare!: number;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Whether this base price is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
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
