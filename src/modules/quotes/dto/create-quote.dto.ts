import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsEnum, IsMongoId, ValidateNested } from 'class-validator';
import { VehicleClass } from '../../pricing/schemas/base-price.schema';

export class PlaceDto {
  @ApiProperty({ enum: ['airport', 'address'], example: 'airport' })
  @IsString()
  @IsNotEmpty()
  type!: 'airport' | 'address';

  @ApiPropertyOptional({ example: 'MRU', description: 'IATA code when type=airport' })
  @IsOptional()
  @IsString()
  airportCode?: string;

  @ApiPropertyOptional({ example: 'T1' })
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiPropertyOptional({ example: 'Port Louis, Mauritius' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: -20.4317, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 57.5529, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Pre-determined region ID if known' })
  @IsOptional()
  @IsMongoId()
  regionId?: string;
}

export class CreateQuoteDto {
  @ApiProperty({ type: PlaceDto, description: 'Origin place (airport or address)' })
  @ValidateNested()
  @Type(() => PlaceDto)
  origin!: PlaceDto;

  @ApiProperty({ type: PlaceDto, description: 'Destination place (airport or address)' })
  @ValidateNested()
  @Type(() => PlaceDto)
  destination!: PlaceDto;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  @IsDateString()
  pickupAt!: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  pax!: number;

  @ApiProperty({ minimum: 0, example: 2 })
  @IsInt()
  @Min(0)
  bags!: number;

  @ApiPropertyOptional({ type: [String], example: ['child_seat'], description: 'Additional services/extras' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];

  @ApiPropertyOptional({ 
    enum: VehicleClass, 
    description: 'Preferred vehicle class (if not specified, all classes will be quoted)' 
  })
  @IsOptional()
  @IsEnum(VehicleClass)
  preferredVehicleClass?: VehicleClass;

  @ApiPropertyOptional({ 
    example: 15.5, 
    description: 'Pre-calculated distance in km (if available from maps service)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ 
    example: 25, 
    description: 'Pre-calculated duration in minutes (if available from maps service)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;
}

export class PriceBreakdownDto {
  @ApiProperty({ example: 25.0, description: 'Base fare amount' })
  baseFare!: number;

  @ApiPropertyOptional({ example: 12.5, description: 'Distance-based charge' })
  distanceCharge?: number;

  @ApiPropertyOptional({ example: 8.0, description: 'Time-based charge' })
  timeCharge?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Airport fees' })
  airportFees?: number;

  @ApiPropertyOptional({ example: 10.0, description: 'Total surcharges applied' })
  surcharges?: number;

  @ApiPropertyOptional({ example: 5.0, description: 'Cost of extras/add-ons' })
  extras?: number;

  @ApiProperty({ example: 75.5, description: 'Total amount' })
  total!: number;

  @ApiProperty({ example: 'AED', description: 'Currency code' })
  currency!: string;
}

export class SurchargeDetailDto {
  @ApiProperty({ example: 'Night surcharge', description: 'Surcharge name' })
  name!: string;

  @ApiProperty({ example: 'percentage', description: 'How surcharge is applied' })
  application!: string;

  @ApiProperty({ example: 25.0, description: 'Surcharge value' })
  value!: number;

  @ApiProperty({ example: 7.5, description: 'Calculated surcharge amount' })
  amount!: number;

  @ApiPropertyOptional({ description: 'Reason for the surcharge' })
  reason?: string;
}

export class QuoteVehicleClassDto {
  @ApiProperty({ enum: VehicleClass, example: VehicleClass.ECONOMY })
  id!: VehicleClass;

  @ApiProperty({ example: 'Economy' })
  name!: string;

  @ApiProperty({ example: 3, description: 'Passenger capacity' })
  paxCapacity!: number;

  @ApiProperty({ example: 2, description: 'Luggage capacity' })
  bagCapacity!: number;

  @ApiPropertyOptional({ example: 'https://example.com/vehicle.jpg', description: 'Vehicle image URL' })
  image?: string;

  @ApiProperty({ type: PriceBreakdownDto })
  pricing!: PriceBreakdownDto;

  @ApiPropertyOptional({ type: [SurchargeDetailDto] })
  appliedSurcharges?: SurchargeDetailDto[];

  @ApiPropertyOptional({ example: 15, description: 'Included waiting time in minutes' })
  includedWaitingTime?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Price per additional minute of waiting' })
  additionalWaitingPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether this is a fixed route price' })
  isFixedPrice?: boolean;
}

export class QuotePolicyDto {
  @ApiProperty({ example: 'Free cancellation until 24 hours before pickup' })
  cancellation!: string;

  @ApiProperty({ example: '60 minutes after landing for arrivals' })
  includedWait!: string;

  @ApiPropertyOptional({ example: '1.50 AED per minute' })
  additionalWaitCharge?: string;

  @ApiPropertyOptional({ example: '2025-09-04T11:00:00.000Z' })
  quoteExpiresAt?: string;
}

export class QuoteResponseDto {
  @ApiProperty({ example: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1' })
  quoteId!: string;

  @ApiProperty({ type: [QuoteVehicleClassDto] })
  vehicleClasses!: QuoteVehicleClassDto[];

  @ApiProperty({ type: QuotePolicyDto })
  policy!: QuotePolicyDto;

  @ApiPropertyOptional({ example: 15.5, description: 'Estimated distance in kilometers' })
  estimatedDistance?: number;

  @ApiPropertyOptional({ example: 25, description: 'Estimated duration in minutes' })
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 'Dubai Airport (DXB)', description: 'Origin location name' })
  originName?: string;

  @ApiPropertyOptional({ example: 'Downtown Dubai', description: 'Destination location name' })
  destinationName?: string;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  pickupAt!: string;

  @ApiProperty({ example: 2 })
  passengers!: number;

  @ApiProperty({ example: 2 })
  luggage!: number;

  @ApiPropertyOptional({ type: [String], example: ['child_seat'] })
  extras?: string[];

  @ApiProperty({ description: 'Quote creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Quote expiration timestamp' })
  expiresAt!: Date;
}
