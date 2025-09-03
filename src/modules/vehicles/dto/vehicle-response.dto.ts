import { ApiProperty } from '@nestjs/swagger';
import { TranslationFieldDto, CapacitySpecsDto } from './create-vehicle.dto';

export class VehicleResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the vehicle',
    example: '60d5ecb54b8b1c001f5e3f5a',
    format: 'ObjectId'
  })
  _id!: string;

  @ApiProperty({ 
    description: 'Primary vehicle name with multi-language support',
    type: TranslationFieldDto,
    example: {
      translations: {
        en: 'Standard Sedan',
        cn: '标准轿车',
        vi: 'Xe sedan tiêu chuẩn'
      },
      value: 'Standard Sedan',
      defaultLanguage: 'en'
    }
  })
  name!: TranslationFieldDto;

  @ApiProperty({ 
    description: 'Alternative vehicle name with multi-language support',
    type: TranslationFieldDto,
    example: {
      translations: {
        en: 'City Car',
        cn: '城市轿车',
        vi: 'Xe thành phố'
      },
      value: 'City Car',
      defaultLanguage: 'en'
    }
  })
  equivalent!: TranslationFieldDto;

  @ApiProperty({ 
    description: 'Physical type classification of the vehicle',
    enum: ['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'],
    example: 'sedan',
    enumName: 'VehicleType'
  })
  vehicleType!: string;

  @ApiProperty({ 
    description: 'Service category determining pricing and target market',
    enum: ['economy', 'standard', 'premium', 'luxury', 'business'],
    example: 'standard',
    enumName: 'VehicleCategory'
  })
  category!: string;

  @ApiProperty({ 
    description: 'URL to vehicle image for display purposes',
    example: 'https://example.com/images/vehicles/sedan-black.jpg',
    format: 'url',
    nullable: true
  })
  image?: string;

  @ApiProperty({ 
    description: 'Detailed capacity specifications',
    type: CapacitySpecsDto,
    example: {
      maxPassengers: 4,
      maxLuggage: 2,
      maxWeight: 400
    }
  })
  capacity!: CapacitySpecsDto;

  @ApiProperty({ 
    description: 'Electric vehicle status',
    example: false,
    type: 'boolean'
  })
  isElectric!: boolean;

  @ApiProperty({ 
    description: 'Current availability status for bookings',
    example: true,
    type: 'boolean'
  })
  isActive!: boolean;

  @ApiProperty({ 
    description: 'Detailed vehicle description and features',
    example: 'Comfortable sedan perfect for city trips and airport transfers with modern amenities',
    nullable: true,
    maxLength: 500
  })
  description?: string;

  @ApiProperty({ 
    description: 'Base pricing rate per kilometer in local currency',
    example: 1.5,
    type: 'number',
    format: 'decimal',
    nullable: true
  })
  baseRatePerKm?: number;

  @ApiProperty({ 
    description: 'Vehicle license plate for identification',
    example: 'ABC-1234',
    nullable: true,
    maxLength: 20
  })
  licensePlate?: string;

  @ApiProperty({ 
    description: 'Vehicle model name',
    example: 'Camry',
    nullable: true,
    maxLength: 50
  })
  model?: string;

  @ApiProperty({ 
    description: 'Vehicle brand/manufacturer',
    example: 'Toyota',
    nullable: true,
    maxLength: 50
  })
  brand?: string;

  @ApiProperty({ 
    description: 'Manufacturing year',
    example: 2023,
    type: 'integer',
    nullable: true
  })
  year?: number;

  @ApiProperty({ 
    description: 'Primary vehicle color',
    example: 'Black',
    nullable: true,
    maxLength: 30
  })
  color?: string;

  @ApiProperty({ 
    description: 'List of available features and amenities',
    example: ['GPS Navigation', 'Air Conditioning', 'WiFi', 'Phone Charger', 'Bluetooth Audio'],
    type: [String],
    nullable: true
  })
  features?: string[];

  @ApiProperty({ 
    description: 'Timestamp when the vehicle was created',
    example: '2023-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  createdAt!: Date;

  @ApiProperty({ 
    description: 'Timestamp when the vehicle was last updated',
    example: '2023-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  updatedAt!: Date;
}

export class VehicleListResponseDto {
  @ApiProperty({ 
    description: 'Array of vehicle objects matching the query criteria',
    type: [VehicleResponseDto],
    example: [
      {
        _id: '60d5ecb54b8b1c001f5e3f5a',
        name: {
          translations: { en: 'Standard Sedan', cn: '标准轿车', vi: 'Xe sedan tiêu chuẩn' },
          value: 'Standard Sedan',
          defaultLanguage: 'en'
        },
        vehicleType: 'sedan',
        category: 'standard',
        capacity: { maxPassengers: 4, maxLuggage: 2, maxWeight: 400 },
        isElectric: false,
        isActive: true
      }
    ]
  })
  vehicles!: VehicleResponseDto[];

  @ApiProperty({ 
    description: 'Total number of vehicles matching the query criteria (across all pages)',
    example: 25,
    type: 'integer',
    minimum: 0
  })
  total!: number;

  @ApiProperty({ 
    description: 'Current page number (1-based)',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  page!: number;

  @ApiProperty({ 
    description: 'Number of vehicles returned in this page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100
  })
  limit!: number;

  @ApiProperty({ 
    description: 'Total number of pages available for the query',
    example: 3,
    type: 'integer',
    minimum: 1
  })
  totalPages!: number;
}
