import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsPhoneNumber, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DriverStatus, DriverAvailability } from '../schemas/simple-driver.schema';

export class DriverLocationDto {
  @ApiProperty({ example: 25.2532, description: 'Latitude coordinate' })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 55.3644, description: 'Longitude coordinate' })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ example: 'Dubai Airport Terminal 3' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 10, description: 'Location accuracy in meters' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 45, description: 'Heading in degrees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ example: 25.5, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}

export class DriverVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make!: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  model!: string;

  @ApiProperty({ example: '2020' })
  @IsString()
  year!: string;

  @ApiProperty({ example: 'White' })
  @IsString()
  color!: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  licensePlate!: string;

  @ApiProperty({ example: 'sedan' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 4, description: 'Passenger capacity' })
  @IsNumber()
  @Min(1)
  @Max(8)
  capacity!: number;

  @ApiProperty({ example: 2, description: 'Luggage capacity' })
  @IsNumber()
  @Min(0)
  @Max(10)
  luggageCapacity!: number;

  @ApiPropertyOptional({ type: [String], example: ['air_conditioning', 'wifi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/vehicle.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateDriverLocationDto {
  @ApiProperty({ type: DriverLocationDto })
  @ValidateNested()
  @Type(() => DriverLocationDto)
  location!: DriverLocationDto;
}

export class UpdateDriverStatusDto {
  @ApiProperty({ enum: DriverStatus, example: DriverStatus.ONLINE })
  @IsEnum(DriverStatus)
  status!: DriverStatus;

  @ApiPropertyOptional({ enum: DriverAvailability, example: DriverAvailability.AVAILABLE })
  @IsOptional()
  @IsEnum(DriverAvailability)
  availability?: DriverAvailability;
}

export class DriverJobDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  bookingId!: string;

  @ApiProperty({ example: 'John Doe' })
  passengerName!: string;

  @ApiProperty({ example: '+971501234567' })
  passengerPhone!: string;

  @ApiProperty({ example: 'Dubai Airport Terminal 3' })
  pickupLocation!: string;

  @ApiProperty({ example: 'Downtown Dubai' })
  destinationLocation!: string;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  pickupTime!: string;

  @ApiProperty({ example: 2 })
  passengers!: number;

  @ApiProperty({ example: 1 })
  luggage!: number;

  @ApiProperty({ example: 'Economy' })
  vehicleClass!: string;

  @ApiProperty({ example: 75.50 })
  fare!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiPropertyOptional({ type: [String], example: ['child_seat'] })
  extras?: string[];

  @ApiPropertyOptional({ example: 'Please wait near exit A2' })
  notes?: string;

  @ApiProperty({ example: '2025-09-04T09:30:00.000Z' })
  assignedAt!: string;

  @ApiProperty({ example: 15, description: 'Time in minutes to accept/decline' })
  timeToRespond!: number;
}

export class DriverJobResponseDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  bookingId!: string;

  @ApiProperty({ example: 'assigned' })
  status!: string;

  @ApiProperty({ example: 'Job assigned successfully' })
  message!: string;

  @ApiProperty({ example: '2025-09-04T09:30:00.000Z' })
  timestamp!: string;
}

export class AcceptJobDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  @IsString()
  bookingId!: string;

  @ApiPropertyOptional({ example: 'On my way!' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ type: DriverLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverLocationDto)
  currentLocation?: DriverLocationDto;
}

export class DeclineJobDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  @IsString()
  bookingId!: string;

  @ApiProperty({ example: 'Vehicle breakdown', description: 'Reason for declining' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ example: 'My car is not working properly' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class UpdateJobStatusDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  @IsString()
  bookingId!: string;

  @ApiProperty({ 
    enum: ['en_route', 'arrived', 'waiting', 'on_trip', 'completed'],
    example: 'en_route'
  })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: 'Arrived at pickup location' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ type: DriverLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverLocationDto)
  location?: DriverLocationDto;

  @ApiPropertyOptional({ example: 'Passenger is running late' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverStatsDto {
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

  @ApiProperty({ example: '2025-09-03T18:30:00.000Z' })
  lastTripDate?: string;

  @ApiProperty({ example: 45.5 })
  onlineHours!: number;
}

export class DriverProfileDto {
  @ApiProperty({ example: 'd1234567-89ab-cdef-0123-456789abcdef' })
  driverId!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: '+971501234567' })
  phone!: string;

  @ApiPropertyOptional({ example: 'https://example.com/profile.jpg' })
  profileImageUrl?: string;

  @ApiProperty({ enum: DriverStatus, example: DriverStatus.ONLINE })
  status!: DriverStatus;

  @ApiProperty({ enum: DriverAvailability, example: DriverAvailability.AVAILABLE })
  availability!: DriverAvailability;

  @ApiPropertyOptional({ type: DriverLocationDto })
  currentLocation?: DriverLocationDto;

  @ApiProperty({ type: DriverVehicleDto })
  vehicle!: DriverVehicleDto;

  @ApiProperty({ type: DriverStatsDto })
  stats!: DriverStatsDto;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  lastActiveAt?: string;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  updatedAt!: string;
}

export class DriverJobsListDto {
  @ApiProperty({ type: [DriverJobDto] })
  jobs!: DriverJobDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 2 })
  pending!: number;

  @ApiProperty({ example: 1 })
  active!: number;
}
