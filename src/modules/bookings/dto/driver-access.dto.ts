import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '../schemas/simple-booking.schema';

// ============ Request DTOs ============

export class DriverAcceptBookingDto {
  @ApiPropertyOptional({
    description: 'Optional notes from driver when accepting',
    example: 'I will be there 10 minutes early',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverDeclineBookingDto {
  @ApiProperty({
    description: 'Reason for declining the booking',
    example: 'Vehicle maintenance required',
  })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverUpdateStatusDto {
  @ApiProperty({
    description: 'New status for the booking',
    enum: [BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.WAITING, BookingStatus.ON_TRIP, BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
    example: BookingStatus.EN_ROUTE,
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional({
    description: 'Driver current latitude',
    example: -20.4284,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Driver current longitude',
    example: 57.6589,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Passenger found at terminal exit',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverUpdateLocationDto {
  @ApiProperty({
    description: 'Driver current latitude',
    example: -20.4284,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Driver current longitude',
    example: 57.6589,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Current address (optional, can be geocoded from coordinates)',
    example: 'MRU Airport, Terminal 1',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Heading/bearing in degrees (0-360)',
    example: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({
    description: 'Speed in km/h',
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}

// ============ Response DTOs ============

export class DriverPassengerDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: '+230 5712 3456' })
  phone!: string;
}

export class DriverLocationDto {
  @ApiPropertyOptional({ example: 'airport' })
  type?: string;

  @ApiPropertyOptional({ example: 'MRU Airport' })
  name?: string;

  @ApiPropertyOptional({ example: 'Plaine Magnien, Mauritius' })
  address?: string;

  @ApiPropertyOptional({ example: -20.4284 })
  latitude?: number;

  @ApiPropertyOptional({ example: 57.6589 })
  longitude?: number;

  @ApiPropertyOptional({ example: 'MRU' })
  airportCode?: string;

  @ApiPropertyOptional({ example: 'International' })
  terminal?: string;
}

export class DriverVehicleInfoDto {
  @ApiProperty({ example: 'Toyota' })
  make!: string;

  @ApiProperty({ example: 'Camry' })
  model!: string;

  @ApiProperty({ example: 'Silver' })
  color!: string;

  @ApiProperty({ example: 'MU 1234' })
  licensePlate!: string;
}

export class DriverInfoDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: 'Jean-Pierre Dupont' })
  name!: string;

  @ApiProperty({ example: '+230 5234 5678' })
  phone!: string;

  @ApiProperty({ type: DriverVehicleInfoDto })
  vehicle!: DriverVehicleInfoDto;
}

export class BookingVehicleDto {
  @ApiProperty({ example: 'economy' })
  class!: string;

  @ApiProperty({ example: 'Economy Sedan' })
  name!: string;
}

export class BookingPricingDto {
  @ApiProperty({ example: 1500 })
  total!: number;

  @ApiProperty({ example: 'MUR' })
  currency!: string;
}

export class DriverBookingResponseDto {
  @ApiProperty({
    description: 'Unique booking ID',
    example: 'BK-20251203-ABC123',
  })
  bookingId!: string;

  @ApiProperty({
    description: 'Current booking status',
    enum: BookingStatus,
    example: BookingStatus.DRIVER_ASSIGNED,
  })
  status!: BookingStatus;

  @ApiProperty({
    description: 'Passenger information',
    type: DriverPassengerDto,
  })
  passenger!: DriverPassengerDto;

  @ApiProperty({
    description: 'Pickup location',
    type: DriverLocationDto,
  })
  origin!: DriverLocationDto;

  @ApiProperty({
    description: 'Drop-off location',
    type: DriverLocationDto,
  })
  destination!: DriverLocationDto;

  @ApiProperty({
    description: 'Scheduled pickup time',
    example: '2025-12-03T10:00:00.000Z',
  })
  pickupAt!: Date;

  @ApiPropertyOptional({
    description: 'Flight number if airport pickup',
    example: 'MK501',
  })
  flightNumber?: string;

  @ApiPropertyOptional({
    description: 'Flight date if different from pickup date',
    example: '2025-12-03',
  })
  flightDate?: string;

  @ApiProperty({
    description: 'Number of passengers',
    example: 2,
  })
  passengers!: number;

  @ApiProperty({
    description: 'Number of luggage items',
    example: 3,
  })
  luggage!: number;

  @ApiPropertyOptional({
    description: 'Extra services requested',
    example: ['child_seat', 'wheelchair'],
  })
  extras?: string[];

  @ApiPropertyOptional({
    description: 'Meet & greet sign text',
    example: 'Mr. Doe',
  })
  signText?: string;

  @ApiPropertyOptional({
    description: 'Special notes or instructions',
    example: 'Elderly passenger, please assist with luggage',
  })
  notes?: string;

  @ApiProperty({
    description: 'Vehicle information',
    type: BookingVehicleDto,
  })
  vehicle!: BookingVehicleDto;

  @ApiProperty({
    description: 'Pricing information',
    type: BookingPricingDto,
  })
  pricing!: BookingPricingDto;

  @ApiPropertyOptional({
    description: 'Assigned driver information',
    type: DriverInfoDto,
  })
  driver?: DriverInfoDto;

  @ApiPropertyOptional({
    description: 'Actual pickup time',
  })
  actualPickupAt?: Date;

  @ApiPropertyOptional({
    description: 'Actual drop-off time',
  })
  actualDropoffAt?: Date;

  @ApiProperty({
    description: 'Booking creation time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update time',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Available actions for the driver based on current status',
    example: ['accept', 'decline'],
  })
  availableActions!: string[];
}

export class GenerateDriverLinkResponseDto {
  @ApiProperty({
    description: 'The access token for the driver',
    example: 'eyJib29raW5nSWQiOiJCSy0yMDI1MTIwMy1BQkMxMjMiLCJkcml2ZXJJZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInRpbWVzdGFtcCI6MTczMzIyNTQwMH0.abc123signature',
  })
  token!: string;

  @ApiProperty({
    description: 'Full URL for driver to access the booking',
    example: 'https://visitmauritiusparadise.com/driver/booking/eyJib29raW5nSWQ...',
  })
  driverLink!: string;

  @ApiProperty({
    description: 'Token expiry time (72 hours after pickup)',
    example: '2025-12-06T10:00:00.000Z',
  })
  expiresAt!: Date;
}

export class DriverActionResponseDto {
  @ApiProperty({
    description: 'Whether the action was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Booking accepted successfully',
  })
  message!: string;
}

