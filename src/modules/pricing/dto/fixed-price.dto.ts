import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, IsDateString, IsMongoId, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleClass } from '../schemas/base-price.schema';
import { RegionInfoDto } from './base-price.dto';

export class CreateFixedPriceDto {
  @ApiProperty({ description: 'Origin region ID' })
  @IsNotEmpty()
  @IsMongoId()
  originRegionId!: string;

  @ApiProperty({ description: 'Destination region ID' })
  @IsNotEmpty()
  @IsMongoId()
  destinationRegionId!: string;

  @ApiProperty({ description: 'Route name', example: 'Dubai Airport to Downtown' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  @IsEnum(VehicleClass)
  vehicleClass!: VehicleClass;

  @ApiProperty({ description: 'Fixed price amount', example: 85.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  fixedPrice!: number;

  @ApiProperty({ description: 'Currency code', example: 'AED' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency!: string;

  @ApiProperty({ description: 'Estimated distance in kilometers', example: 25.5, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  estimatedDistance?: number;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 35, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  estimatedDuration?: number;

  @ApiProperty({ description: 'Included waiting time in minutes', example: 15, default: 15, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : 15)
  includedWaitingTime?: number;

  @ApiProperty({ description: 'Price per additional minute of waiting', example: 1.50, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  additionalWaitingPrice?: number;

  @ApiProperty({ description: 'Whether this fixed price is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({ description: 'Priority for overlapping routes (higher = more priority)', default: 0, required: false })
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

  @ApiProperty({ description: 'Route description and special notes', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({ 
    description: 'Tags for route categorization', 
    example: ['airport', 'popular'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];
}

export class UpdateFixedPriceDto extends PartialType(CreateFixedPriceDto) {
  @ApiProperty({ description: 'Origin region ID', required: false })
  @IsOptional()
  @IsMongoId()
  originRegionId?: string;

  @ApiProperty({ description: 'Destination region ID', required: false })
  @IsOptional()
  @IsMongoId()
  destinationRegionId?: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class', required: false })
  @IsOptional()
  @IsEnum(VehicleClass)
  vehicleClass?: VehicleClass;
}

export class FixedPriceResponseDto {
  @ApiProperty({ description: 'Fixed price ID' })
  _id!: string;

  @ApiProperty({ description: 'Origin region ID' })
  originRegionId!: string;

  @ApiProperty({ description: 'Origin region details', type: RegionInfoDto, required: false })
  originRegion?: RegionInfoDto;

  @ApiProperty({ description: 'Destination region ID' })
  destinationRegionId!: string;

  @ApiProperty({ description: 'Destination region details', type: RegionInfoDto, required: false })
  destinationRegion?: RegionInfoDto;

  @ApiProperty({ description: 'Route name' })
  name!: string;

  @ApiProperty({ enum: VehicleClass, description: 'Vehicle class' })
  vehicleClass!: VehicleClass;

  @ApiProperty({ description: 'Fixed price amount' })
  fixedPrice!: number;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Estimated distance' })
  estimatedDistance?: number;

  @ApiProperty({ description: 'Estimated duration' })
  estimatedDuration?: number;

  @ApiProperty({ description: 'Included waiting time' })
  includedWaitingTime!: number;

  @ApiProperty({ description: 'Additional waiting price' })
  additionalWaitingPrice?: number;

  @ApiProperty({ description: 'Whether active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Priority' })
  priority!: number;

  @ApiProperty({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiProperty({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Tags' })
  tags!: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
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
