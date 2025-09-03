import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class VehicleQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination (starts from 1)',
    minimum: 1,
    default: 1,
    required: false,
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of vehicles to return per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    example: 10,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Search term to filter vehicles by name, description, brand, model, or license plate',
    required: false,
    example: 'sedan',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter vehicles by their physical type',
    enum: ['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'],
    required: false,
    example: 'sedan',
    enumName: 'VehicleTypeFilter'
  })
  @IsOptional()
  @IsEnum(['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'])
  vehicleType?: string;

  @ApiProperty({ 
    description: 'Filter vehicles by their service category',
    enum: ['economy', 'standard', 'premium', 'luxury', 'business'],
    required: false,
    example: 'standard',
    enumName: 'VehicleCategoryFilter'
  })
  @IsOptional()
  @IsEnum(['economy', 'standard', 'premium', 'luxury', 'business'])
  category?: string;

  @ApiProperty({ 
    description: 'Filter by electric vehicle status (true for electric only, false for conventional only)',
    required: false,
    example: false,
    type: 'boolean'
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isElectric?: boolean;

  @ApiProperty({ 
    description: 'Filter by vehicle availability status (true for active only, false for inactive only)',
    required: false,
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Minimum passenger capacity required (inclusive)',
    minimum: 1,
    required: false,
    example: 2,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minPassengers?: number;

  @ApiProperty({ 
    description: 'Maximum passenger capacity allowed (inclusive)',
    minimum: 1,
    required: false,
    example: 8,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxPassengers?: number;

  @ApiProperty({ 
    description: 'Field to sort results by',
    enum: ['name', 'vehicleType', 'category', 'capacity.maxPassengers', 'createdAt', 'updatedAt'],
    default: 'createdAt',
    required: false,
    example: 'createdAt',
    enumName: 'VehicleSortField'
  })
  @IsOptional()
  @IsEnum(['name', 'vehicleType', 'category', 'capacity.maxPassengers', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: 'Sort order direction',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
    example: 'desc',
    enumName: 'SortOrder'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ 
    description: 'Preferred language for translation fields in response',
    enum: ['en', 'cn', 'vi'],
    default: 'en',
    required: false,
    example: 'en',
    enumName: 'PreferredLanguage'
  })
  @IsOptional()
  @IsEnum(['en', 'cn', 'vi'])
  language?: string = 'en';
}
