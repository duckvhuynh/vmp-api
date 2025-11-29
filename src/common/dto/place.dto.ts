import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Place types supported in the system
 */
export enum PlaceType {
  AIRPORT = 'airport',
  ADDRESS = 'address',
  HOTEL = 'hotel',
  PORT = 'port',
}

/**
 * Standard Place DTO used for origin/destination across the entire API
 * Consistent structure for quotes, bookings, and all location-related operations
 */
export class PlaceDto {
  @ApiProperty({
    enum: PlaceType,
    example: PlaceType.AIRPORT,
    description: 'Type of place (airport, address, hotel, port)',
  })
  @IsEnum(PlaceType)
  @IsNotEmpty()
  type!: PlaceType;

  @ApiPropertyOptional({
    example: 'MRU',
    description: 'IATA airport code (required when type=airport)',
  })
  @IsOptional()
  @IsString()
  airportCode?: string;

  @ApiPropertyOptional({
    example: 'T1',
    description: 'Terminal designation (for airports)',
  })
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiPropertyOptional({
    example: 'Sir Seewoosagur Ramgoolam International Airport',
    description: 'Display name of the place',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Plaine Magnien, Mauritius',
    description: 'Full address of the place',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: -20.4302,
    description: 'Latitude coordinate (-90 to 90)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 57.6836,
    description: 'Longitude coordinate (-180 to 180)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Pre-determined pricing region ID (if known)',
  })
  @IsOptional()
  @IsMongoId()
  regionId?: string;

  @ApiPropertyOptional({
    example: 'google_place_abc123',
    description: 'External place ID (e.g., Google Places ID)',
  })
  @IsOptional()
  @IsString()
  placeId?: string;
}

/**
 * Place response DTO for API responses
 */
export class PlaceResponseDto {
  @ApiProperty({ enum: PlaceType, example: PlaceType.AIRPORT })
  type!: PlaceType;

  @ApiPropertyOptional({ example: 'MRU' })
  airportCode?: string;

  @ApiPropertyOptional({ example: 'T1' })
  terminal?: string;

  @ApiProperty({ example: 'Sir Seewoosagur Ramgoolam International Airport' })
  name!: string;

  @ApiPropertyOptional({ example: 'Plaine Magnien, Mauritius' })
  address?: string;

  @ApiPropertyOptional({ example: -20.4302 })
  latitude?: number;

  @ApiPropertyOptional({ example: 57.6836 })
  longitude?: number;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  regionId?: string;
}

/**
 * Helper function to extract display name from PlaceDto
 */
export function getPlaceDisplayName(place: PlaceDto): string {
  if (place.name) return place.name;
  if (place.type === PlaceType.AIRPORT && place.airportCode) {
    return `${place.airportCode}${place.terminal ? ` - ${place.terminal}` : ''}`;
  }
  return place.address || 'Unknown Location';
}

/**
 * Helper function to convert PlaceDto to flat fields for database storage
 */
export function placeToFlatFields(place: PlaceDto, prefix: 'origin' | 'destination'): Record<string, any> {
  return {
    [`${prefix}Type`]: place.type,
    [`${prefix}AirportCode`]: place.airportCode,
    [`${prefix}Terminal`]: place.terminal,
    [`${prefix}Name`]: place.name || getPlaceDisplayName(place),
    [`${prefix}Address`]: place.address,
    [`${prefix}Latitude`]: place.latitude,
    [`${prefix}Longitude`]: place.longitude,
    [`${prefix}RegionId`]: place.regionId,
  };
}

/**
 * Helper function to convert flat fields back to PlaceDto
 */
export function flatFieldsToPlace(data: Record<string, any>, prefix: 'origin' | 'destination'): PlaceResponseDto {
  return {
    type: data[`${prefix}Type`] || PlaceType.ADDRESS,
    airportCode: data[`${prefix}AirportCode`],
    terminal: data[`${prefix}Terminal`],
    name: data[`${prefix}Name`] || data[`${prefix}Address`] || 'Unknown',
    address: data[`${prefix}Address`],
    latitude: data[`${prefix}Latitude`],
    longitude: data[`${prefix}Longitude`],
    regionId: data[`${prefix}RegionId`]?.toString(),
  };
}

