import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  Matches,
} from 'class-validator';
import { DriverStatus, DriverAvailability } from '../schemas/simple-driver.schema';

// ============ Query DTOs ============

export class DriverQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by driver ID, name, email, phone, or license plate' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by driver status',
    enum: DriverStatus
  })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by driver availability',
    enum: DriverAvailability
  })
  @IsOptional()
  @IsEnum(DriverAvailability)
  availability?: DriverAvailability;

  @ApiPropertyOptional({ description: 'Filter by vehicle type' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Minimum rating filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ============ Create/Update DTOs ============

export class CreateDriverDto {
  @ApiProperty({ description: 'Driver first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ description: 'Driver last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ description: 'Driver email', example: 'john.driver@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Driver phone number', example: '+23057001234' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Vehicle make', example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  vehicleMake!: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Camry' })
  @IsString()
  @IsNotEmpty()
  vehicleModel!: string;

  @ApiProperty({ description: 'Vehicle year', example: '2022' })
  @IsString()
  @IsNotEmpty()
  vehicleYear!: string;

  @ApiProperty({ description: 'Vehicle color', example: 'White' })
  @IsString()
  @IsNotEmpty()
  vehicleColor!: string;

  @ApiProperty({ description: 'License plate number', example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @ApiProperty({ description: 'Vehicle type/class', example: 'ECONOMY' })
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @ApiProperty({ description: 'Passenger capacity', example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  capacity!: number;

  @ApiProperty({ description: 'Luggage capacity', example: 3 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  luggageCapacity!: number;

  @ApiPropertyOptional({ description: 'Initial status', enum: DriverStatus, default: DriverStatus.OFFLINE })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'Set driver as active', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Set driver as verified', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}

export class UpdateDriverDto extends PartialType(CreateDriverDto) {}

export class UpdateDriverStatusDto {
  @ApiProperty({ 
    description: 'New driver status',
    enum: DriverStatus,
    example: DriverStatus.ONLINE
  })
  @IsEnum(DriverStatus)
  status!: DriverStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateDriverAvailabilityDto {
  @ApiProperty({ 
    description: 'New driver availability',
    enum: DriverAvailability,
    example: DriverAvailability.AVAILABLE
  })
  @IsEnum(DriverAvailability)
  availability!: DriverAvailability;

  @ApiPropertyOptional({ description: 'Reason for availability change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ActivateDriverDto {
  @ApiProperty({ description: 'Set driver active status', example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Reason for activation/deactivation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyDriverDto {
  @ApiProperty({ description: 'Set driver verification status', example: true })
  @IsBoolean()
  isVerified!: boolean;

  @ApiPropertyOptional({ description: 'Notes for verification decision' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDriverLocationAdminDto {
  @ApiProperty({ description: 'Latitude', example: -20.1609 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: 57.5012 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ description: 'Address description', example: 'Port Louis, Mauritius' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateDriverVehicleDto {
  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Toyota' })
  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Camry' })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({ description: 'Vehicle year', example: '2022' })
  @IsOptional()
  @IsString()
  vehicleYear?: string;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @ApiPropertyOptional({ description: 'License plate number', example: 'ABC-1234' })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ description: 'Vehicle type/class', example: 'ECONOMY' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Passenger capacity', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Luggage capacity', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  luggageCapacity?: number;
}

// ============ Response DTOs ============

export class DriverVehicleResponseDto {
  @ApiProperty({ example: 'Toyota' })
  make!: string;

  @ApiProperty({ example: 'Camry' })
  model!: string;

  @ApiProperty({ example: '2022' })
  year!: string;

  @ApiProperty({ example: 'White' })
  color!: string;

  @ApiProperty({ example: 'ABC-1234' })
  licensePlate!: string;

  @ApiProperty({ example: 'ECONOMY' })
  type!: string;

  @ApiProperty({ example: 4 })
  capacity!: number;

  @ApiProperty({ example: 3 })
  luggageCapacity!: number;
}

export class DriverLocationResponseDto {
  @ApiProperty({ example: -20.1609 })
  latitude!: number;

  @ApiProperty({ example: 57.5012 })
  longitude!: number;

  @ApiPropertyOptional({ example: 'Port Louis, Mauritius' })
  address?: string;

  @ApiPropertyOptional({ example: '2025-10-29T10:00:00.000Z' })
  lastUpdated?: Date;
}

export class DriverStatsResponseDto {
  @ApiProperty({ example: 150 })
  totalTrips!: number;

  @ApiProperty({ example: 145 })
  completedTrips!: number;

  @ApiProperty({ example: 5 })
  cancelledTrips!: number;

  @ApiProperty({ example: 12500.75 })
  totalEarnings!: number;

  @ApiProperty({ example: 4.8 })
  rating!: number;

  @ApiProperty({ example: 120 })
  totalRatings!: number;
}

export class DriverListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id!: string;

  @ApiProperty({ example: 'DRV-20251029-ABC123' })
  driverId!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'john.driver@example.com' })
  email!: string;

  @ApiProperty({ example: '+23057001234' })
  phone!: string;

  @ApiProperty({ enum: DriverStatus, example: DriverStatus.ONLINE })
  status!: DriverStatus;

  @ApiProperty({ enum: DriverAvailability, example: DriverAvailability.AVAILABLE })
  availability!: DriverAvailability;

  @ApiProperty({ type: DriverVehicleResponseDto })
  vehicle!: DriverVehicleResponseDto;

  @ApiProperty({ example: 4.8 })
  rating!: number;

  @ApiProperty({ example: 150 })
  totalTrips!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiPropertyOptional({ example: '2025-10-29T10:00:00.000Z' })
  lastActiveAt?: Date;

  @ApiProperty({ example: '2025-10-29T09:00:00.000Z' })
  createdAt!: Date;
}

export class DriverDetailResponseDto extends DriverListItemDto {
  @ApiPropertyOptional({ type: DriverLocationResponseDto })
  currentLocation?: DriverLocationResponseDto;

  @ApiProperty({ type: DriverStatsResponseDto })
  stats!: DriverStatsResponseDto;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  currentBookingId?: string;

  @ApiProperty({ example: '2025-10-29T09:00:00.000Z' })
  updatedAt!: Date;
}

export class DriverListResponseDto {
  @ApiProperty({ type: [DriverListItemDto] })
  drivers!: DriverListItemDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}

export class DriverStatsOverviewDto {
  @ApiProperty({ example: 50 })
  totalDrivers!: number;

  @ApiProperty({ example: 35 })
  activeDrivers!: number;

  @ApiProperty({ example: 40 })
  verifiedDrivers!: number;

  @ApiProperty({ example: 20 })
  onlineDrivers!: number;

  @ApiProperty({ example: 15 })
  availableDrivers!: number;

  @ApiProperty({ example: 5 })
  busyDrivers!: number;

  @ApiProperty({ example: 30 })
  offlineDrivers!: number;

  @ApiProperty({ example: 4.5 })
  averageRating!: number;

  @ApiProperty({ example: 7500 })
  totalTripsThisMonth!: number;

  @ApiProperty({ example: 125000.50 })
  totalEarningsThisMonth!: number;

  @ApiProperty({ 
    description: 'Drivers by status',
    example: { online: 20, offline: 30, busy: 5, on_break: 5 }
  })
  byStatus!: Record<string, number>;

  @ApiProperty({ 
    description: 'Drivers by vehicle type',
    example: { ECONOMY: 25, COMFORT: 15, PREMIUM: 10 }
  })
  byVehicleType!: Record<string, number>;
}

export class NearbyDriverDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id!: string;

  @ApiProperty({ example: 'DRV-20251029-ABC123' })
  driverId!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: '+23057001234' })
  phone!: string;

  @ApiProperty({ type: DriverVehicleResponseDto })
  vehicle!: DriverVehicleResponseDto;

  @ApiProperty({ type: DriverLocationResponseDto })
  location!: DriverLocationResponseDto;

  @ApiProperty({ example: 2.5, description: 'Distance in km' })
  distance!: number;

  @ApiProperty({ example: 4.8 })
  rating!: number;

  @ApiProperty({ example: 150 })
  totalTrips!: number;
}

export class NearbyDriversQueryDto {
  @ApiProperty({ description: 'Latitude', example: -20.1609 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: 57.5012 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ description: 'Search radius in km', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by vehicle type' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Limit results', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

