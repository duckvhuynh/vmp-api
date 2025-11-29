import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { BookingStatus } from '../schemas/simple-booking.schema';

// ============ Create DTO ============

export class AdminCreateBookingDto {
  @ApiProperty({ description: 'Passenger first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  passengerFirstName!: string;

  @ApiProperty({ description: 'Passenger last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  passengerLastName!: string;

  @ApiProperty({ description: 'Passenger phone number', example: '+23057123456' })
  @IsString()
  @IsNotEmpty()
  passengerPhone!: string;

  @ApiPropertyOptional({ description: 'Passenger email', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  passengerEmail?: string;

  @ApiProperty({ description: 'Origin/Pickup name', example: 'Sir Seewoosagur Ramgoolam International Airport' })
  @IsString()
  @IsNotEmpty()
  originName!: string;

  @ApiPropertyOptional({ description: 'Origin full address' })
  @IsOptional()
  @IsString()
  originAddress?: string;

  @ApiPropertyOptional({ description: 'Origin latitude', example: -20.4302 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  originLatitude?: number;

  @ApiPropertyOptional({ description: 'Origin longitude', example: 57.6836 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  originLongitude?: number;

  @ApiProperty({ description: 'Destination name', example: 'Le Morne Beach' })
  @IsString()
  @IsNotEmpty()
  destinationName!: string;

  @ApiPropertyOptional({ description: 'Destination full address' })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiPropertyOptional({ description: 'Destination latitude', example: -20.4499 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLatitude?: number;

  @ApiPropertyOptional({ description: 'Destination longitude', example: 57.3174 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLongitude?: number;

  @ApiProperty({ description: 'Pickup date/time (ISO string)', example: '2025-12-01T10:00:00.000Z' })
  @IsDateString()
  pickupAt!: string;

  @ApiProperty({ description: 'Number of passengers', example: 2, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passengers!: number;

  @ApiProperty({ description: 'Number of luggage items', example: 2, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  luggage!: number;

  @ApiPropertyOptional({ description: 'Extras requested', type: [String], example: ['child_seat'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];

  @ApiProperty({ description: 'Vehicle class', example: 'economy' })
  @IsString()
  @IsNotEmpty()
  vehicleClass!: string;

  @ApiPropertyOptional({ description: 'Vehicle display name', example: 'Economy Sedan' })
  @IsOptional()
  @IsString()
  vehicleName?: string;

  @ApiPropertyOptional({ description: 'Vehicle passenger capacity', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vehicleCapacity?: number;

  @ApiPropertyOptional({ description: 'Vehicle luggage capacity', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vehicleBagCapacity?: number;

  @ApiProperty({ description: 'Base fare amount', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseFare!: number;

  @ApiPropertyOptional({ description: 'Distance charge', example: 350 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceCharge?: number;

  @ApiPropertyOptional({ description: 'Time charge', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  timeCharge?: number;

  @ApiPropertyOptional({ description: 'Airport fees', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  airportFees?: number;

  @ApiPropertyOptional({ description: 'Surcharges', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  surcharges?: number;

  @ApiPropertyOptional({ description: 'Extras total', example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extrasTotal?: number;

  @ApiProperty({ description: 'Total amount', example: 1200 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'MUR', default: 'MUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Initial booking status (defaults to confirmed for admin bookings)',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Assign driver immediately (optional)', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  assignedDriverId?: string;

  @ApiPropertyOptional({ description: 'User ID if booking for existing user', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ description: 'Mark payment as confirmed (for cash/manual payments)', default: false })
  @IsOptional()
  @IsBoolean()
  paymentConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Payment method for manual bookings', example: 'cash' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Admin notes for this booking' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

// ============ Query DTOs ============

export class BookingQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by booking ID, passenger name, phone, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by booking status',
    enum: BookingStatus
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned driver ID' })
  @IsOptional()
  @IsMongoId()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle class' })
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiPropertyOptional({ description: 'Filter bookings from this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter bookings until this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ============ Update DTOs ============

export class UpdateBookingStatusDto {
  @ApiProperty({ 
    description: 'New booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignDriverDto {
  @ApiProperty({ description: 'Driver ID to assign', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  driverId!: string;

  @ApiPropertyOptional({ description: 'Notes for the driver' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingNotesDto {
  @ApiProperty({ description: 'Admin notes for the booking' })
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

export class AdminUpdateBookingDto {
  @ApiPropertyOptional({ description: 'Passenger first name' })
  @IsOptional()
  @IsString()
  passengerFirstName?: string;

  @ApiPropertyOptional({ description: 'Passenger last name' })
  @IsOptional()
  @IsString()
  passengerLastName?: string;

  @ApiPropertyOptional({ description: 'Passenger phone' })
  @IsOptional()
  @IsString()
  passengerPhone?: string;

  @ApiPropertyOptional({ description: 'Pickup date/time (ISO string)' })
  @IsOptional()
  @IsDateString()
  pickupAt?: string;

  @ApiPropertyOptional({ description: 'Origin name' })
  @IsOptional()
  @IsString()
  originName?: string;

  @ApiPropertyOptional({ description: 'Origin address' })
  @IsOptional()
  @IsString()
  originAddress?: string;

  @ApiPropertyOptional({ description: 'Destination name' })
  @IsOptional()
  @IsString()
  destinationName?: string;

  @ApiPropertyOptional({ description: 'Destination address' })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiPropertyOptional({ description: 'Number of passengers' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passengers?: number;

  @ApiPropertyOptional({ description: 'Number of luggage items' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  luggage?: number;

  @ApiPropertyOptional({ description: 'Extras requested', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class AdminCancelBookingDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Refund amount (if different from default)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddBookingEventDto {
  @ApiProperty({ description: 'Event type', example: 'note_added' })
  @IsString()
  @IsNotEmpty()
  event!: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Location of event' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

// ============ Response DTOs ============

export class BookingEventResponseDto {
  @ApiProperty({ example: 'status_update' })
  event!: string;

  @ApiProperty({ example: 'confirmed' })
  status!: string;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  timestamp!: Date;

  @ApiPropertyOptional({ example: 'Booking confirmed by admin' })
  description?: string;

  @ApiPropertyOptional({ example: 'Dubai Airport' })
  location?: string;
}

export class BookingListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id!: string;

  @ApiProperty({ example: 'BK-20251029-ABC123' })
  bookingId!: string;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  status!: BookingStatus;

  @ApiProperty({ example: 'John Doe' })
  passengerName!: string;

  @ApiProperty({ example: '+971501234567' })
  passengerPhone!: string;

  @ApiProperty({ example: 'Dubai Airport' })
  originName!: string;

  @ApiProperty({ example: 'Downtown Dubai' })
  destinationName!: string;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  pickupAt!: Date;

  @ApiProperty({ example: 'ECONOMY' })
  vehicleClass!: string;

  @ApiProperty({ example: 75.50 })
  total!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiPropertyOptional({ example: 'John Driver' })
  driverName?: string;

  @ApiProperty({ example: '2025-10-29T09:00:00.000Z' })
  createdAt!: Date;
}

export class BookingDetailResponseDto extends BookingListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId!: string;

  @ApiProperty({ example: 'John' })
  passengerFirstName!: string;

  @ApiProperty({ example: 'Doe' })
  passengerLastName!: string;

  @ApiPropertyOptional({ example: 'Dubai International Airport' })
  originAddress?: string;

  @ApiPropertyOptional({ example: 25.2532 })
  originLatitude?: number;

  @ApiPropertyOptional({ example: 55.3644 })
  originLongitude?: number;

  @ApiPropertyOptional({ example: 'Downtown Dubai Hotel' })
  destinationAddress?: string;

  @ApiPropertyOptional({ example: 25.1972 })
  destinationLatitude?: number;

  @ApiPropertyOptional({ example: 55.2744 })
  destinationLongitude?: number;

  @ApiProperty({ example: 2 })
  passengers!: number;

  @ApiProperty({ example: 1 })
  luggage!: number;

  @ApiProperty({ type: [String], example: ['child_seat'] })
  extras!: string[];

  @ApiProperty({ example: 'Economy' })
  vehicleName!: string;

  @ApiProperty({ example: 4 })
  vehicleCapacity!: number;

  @ApiProperty({ example: 2 })
  vehicleBagCapacity!: number;

  @ApiProperty({ example: 25.0 })
  baseFare!: number;

  @ApiPropertyOptional({ example: 15.0 })
  distanceCharge?: number;

  @ApiPropertyOptional({ example: 10.0 })
  timeCharge?: number;

  @ApiPropertyOptional({ example: 15.0 })
  airportFees?: number;

  @ApiPropertyOptional({ example: 5.0 })
  surcharges?: number;

  @ApiPropertyOptional({ example: 5.5 })
  extrasTotal?: number;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  assignedDriver?: string;

  @ApiProperty({ type: [BookingEventResponseDto] })
  events!: BookingEventResponseDto[];

  @ApiPropertyOptional({ example: '2025-10-29T10:05:00.000Z' })
  paymentConfirmedAt?: Date;

  @ApiPropertyOptional({ example: 'pi_1234567890' })
  paymentIntentId?: string;

  @ApiPropertyOptional({ example: '2025-10-29T10:15:00.000Z' })
  actualPickupAt?: Date;

  @ApiPropertyOptional({ example: '2025-10-29T10:45:00.000Z' })
  actualDropoffAt?: Date;

  @ApiProperty({ example: '2025-10-29T09:00:00.000Z' })
  updatedAt!: Date;
}

export class BookingListResponseDto {
  @ApiProperty({ type: [BookingListItemDto] })
  bookings!: BookingListItemDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}

export class BookingStatsDto {
  @ApiProperty({ example: 150 })
  totalBookings!: number;

  @ApiProperty({ example: 25 })
  pendingBookings!: number;

  @ApiProperty({ example: 45 })
  confirmedBookings!: number;

  @ApiProperty({ example: 15 })
  activeBookings!: number;

  @ApiProperty({ example: 60 })
  completedBookings!: number;

  @ApiProperty({ example: 5 })
  cancelledBookings!: number;

  @ApiProperty({ example: 12500.75 })
  totalRevenue!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: 83.33 })
  averageBookingValue!: number;

  @ApiProperty({ 
    description: 'Bookings by status',
    example: { pending_payment: 25, confirmed: 45, completed: 60 }
  })
  byStatus!: Record<string, number>;

  @ApiProperty({ 
    description: 'Bookings by vehicle class',
    example: { ECONOMY: 50, COMFORT: 30, PREMIUM: 20 }
  })
  byVehicleClass!: Record<string, number>;
}

