import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsEnum, 
  IsBoolean, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  IsArray, 
  ValidateNested, 
  IsNotEmpty 
} from 'class-validator';

export class TranslationDto {
  @ApiProperty({ 
    description: 'English translation of the vehicle name or equivalent',
    example: 'Standard Sedan',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  en!: string;

  @ApiProperty({ 
    description: 'Chinese translation of the vehicle name or equivalent',
    example: '标准轿车',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  cn!: string;

  @ApiProperty({ 
    description: 'Vietnamese translation of the vehicle name or equivalent',
    example: 'Xe sedan tiêu chuẩn',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  vi!: string;
}

export class TranslationFieldDto {
  @ApiProperty({ 
    description: 'Translations object containing text in multiple languages (English, Chinese, Vietnamese)',
    type: TranslationDto,
    example: {
      en: 'Standard Sedan',
      cn: '标准轿车',
      vi: 'Xe sedan tiêu chuẩn'
    }
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  translations!: TranslationDto;

  @ApiProperty({ 
    description: 'Default fallback value to use when specific language translation is not available or when language preference is not set',
    example: 'Standard Sedan',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({ 
    description: 'Primary language code for this field - determines which translation is considered the default',
    enum: ['en', 'cn', 'vi'],
    example: 'en',
    enumName: 'SupportedLanguages'
  })
  @IsEnum(['en', 'cn', 'vi'])
  defaultLanguage!: string;
}

export class CapacitySpecsDto {
  @ApiProperty({ 
    description: 'Maximum number of passengers this vehicle can accommodate including driver',
    minimum: 1,
    maximum: 50,
    example: 4,
    type: 'integer'
  })
  @IsNumber()
  @Min(1)
  maxPassengers!: number;

  @ApiProperty({ 
    description: 'Maximum number of standard luggage pieces this vehicle can carry',
    minimum: 0,
    maximum: 20,
    example: 2,
    type: 'integer'
  })
  @IsNumber()
  @Min(0)
  maxLuggage!: number;

  @ApiProperty({ 
    description: 'Maximum weight capacity in kilograms for luggage and passengers',
    minimum: 0,
    maximum: 5000,
    example: 500,
    required: false,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number;
}

export class CreateVehicleDto {
  @ApiProperty({ 
    description: 'Primary name of the vehicle with multi-language support. This is the main identifier for the vehicle type.',
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
  @ValidateNested()
  @Type(() => TranslationFieldDto)
  name!: TranslationFieldDto;

  @ApiProperty({ 
    description: 'Alternative or equivalent name for the vehicle with multi-language support. Used for marketing or regional variations.',
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
  @ValidateNested()
  @Type(() => TranslationFieldDto)
  equivalent!: TranslationFieldDto;

  @ApiProperty({ 
    description: 'Classification of vehicle by physical type and design',
    enum: ['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'],
    example: 'sedan',
    enumName: 'VehicleType'
  })
  @IsEnum(['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'])
  vehicleType!: string;

  @ApiProperty({ 
    description: 'Service category determining pricing tier and target market segment',
    enum: ['economy', 'standard', 'premium', 'luxury', 'business'],
    example: 'standard',
    enumName: 'VehicleCategory'
  })
  @IsEnum(['economy', 'standard', 'premium', 'luxury', 'business'])
  category!: string;

  @ApiProperty({ 
    description: 'URL to vehicle image for display in booking interface and marketing materials',
    example: 'https://example.com/images/vehicles/sedan-black.jpg',
    required: false,
    format: 'url'
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ 
    description: 'Detailed capacity specifications for passengers, luggage, and weight limits',
    type: CapacitySpecsDto,
    example: {
      maxPassengers: 4,
      maxLuggage: 2,
      maxWeight: 400
    }
  })
  @ValidateNested()
  @Type(() => CapacitySpecsDto)
  capacity!: CapacitySpecsDto;

  @ApiProperty({ 
    description: 'Whether this vehicle uses electric power (true) or conventional fuel (false)',
    default: false,
    example: false,
    type: 'boolean'
  })
  @IsBoolean()
  @IsOptional()
  isElectric?: boolean = false;

  @ApiProperty({ 
    description: 'Whether this vehicle is currently available for booking and operations',
    default: true,
    example: true,
    type: 'boolean'
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ 
    description: 'Detailed description of vehicle features, comfort level, and suitable use cases',
    example: 'Comfortable sedan perfect for city trips and airport transfers with modern amenities',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Base rate per kilometer for pricing calculations in local currency',
    minimum: 0,
    maximum: 1000,
    example: 1.5,
    required: false,
    type: 'number',
    format: 'decimal'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseRatePerKm?: number;

  @ApiProperty({ 
    description: 'Vehicle license plate number for identification and legal compliance',
    example: 'ABC-1234',
    required: false,
    pattern: '^[A-Z0-9-]+$',
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiProperty({ 
    description: 'Vehicle model name as specified by manufacturer',
    example: 'Camry',
    required: false,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ 
    description: 'Vehicle brand/manufacturer name',
    example: 'Toyota',
    required: false,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ 
    description: 'Manufacturing year of the vehicle',
    minimum: 1900,
    maximum: new Date().getFullYear() + 1,
    example: 2023,
    required: false,
    type: 'integer'
  })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiProperty({ 
    description: 'Primary color of the vehicle exterior',
    example: 'Black',
    required: false,
    maxLength: 30
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ 
    description: 'Array of additional features and amenities available in this vehicle',
    example: ['GPS Navigation', 'Air Conditioning', 'WiFi', 'Phone Charger', 'Bluetooth Audio'],
    required: false,
    type: [String],
    maxItems: 20
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
