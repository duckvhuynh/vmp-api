import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class PassengerDto {
  @ApiProperty({ example: 'John', description: 'Passenger first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Passenger last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

class ContactDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+230 5712 3456' })
  @IsString()
  phone!: string;
}

class FlightDto {
  @ApiProperty({ example: 'MK015', description: 'Flight number' })
  @IsString()
  number!: string;

  @ApiPropertyOptional({ example: '2025-09-04', description: 'Flight date (ISO format)' })
  @IsOptional()
  @IsString()
  date?: string;
}

export class CreateBookingDto {
  @ApiProperty({ 
    example: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1',
    description: 'Quote ID from the quotes API'
  })
  @IsString()
  @IsNotEmpty()
  quoteId!: string;

  @ApiProperty({ 
    example: 'economy',
    description: 'Selected vehicle class from the quote options (e.g., economy, comfort, premium, van, luxury)'
  })
  @IsString()
  @IsNotEmpty()
  selectedVehicleClass!: string;

  @ApiProperty({ type: PassengerDto, description: 'Passenger details' })
  @ValidateNested()
  @Type(() => PassengerDto)
  passenger!: PassengerDto;

  @ApiProperty({ type: ContactDto, description: 'Contact information' })
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @ApiPropertyOptional({ type: FlightDto, description: 'Flight details (for airport pickups)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightDto)
  flight?: FlightDto;

  @ApiPropertyOptional({ example: 'Mr. John Doe', description: 'Sign text for meet & greet' })
  @IsOptional()
  @IsString()
  signText?: string;

  @ApiPropertyOptional({ example: 'Please wait near exit A2', description: 'Special instructions' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String], example: ['child_seat'], description: 'Additional extras' })
  @IsOptional()
  @IsArray()
  extras?: string[];
}

export class BookingConfirmationDto {
  @ApiProperty({ example: 'Booking created, awaiting payment' })
  message!: string;
}

export class PaymentInfoDto {
  @ApiProperty({ example: 1200.50, description: 'Amount to pay' })
  amount!: number;

  @ApiProperty({ example: 'MUR', description: 'Currency code' })
  currency!: string;

  @ApiProperty({ example: 'BK-20251129-ABC123', description: 'Booking ID to use for payment' })
  bookingId!: string;

  @ApiProperty({ 
    example: '/api/v1/payments/checkout',
    description: 'Endpoint to create payment checkout'
  })
  checkoutEndpoint!: string;
}

export class BookingSummaryDto {
  @ApiProperty({ example: 'MRU Airport - Terminal 1' })
  origin!: string;

  @ApiProperty({ example: 'Le Morne Beach' })
  destination!: string;

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  pickupAt!: string;

  @ApiProperty({ example: 'Economy' })
  vehicleClass!: string;

  @ApiProperty({ example: 'Economy Sedan' })
  vehicleName!: string;

  @ApiProperty({ example: 2 })
  passengers!: number;

  @ApiProperty({ example: 2 })
  luggage!: number;

  @ApiPropertyOptional({ example: 'MK015' })
  flightNumber?: string;
}

export class BookingResponseDto {
  @ApiProperty({ example: 'BK-20251129-ABC123' })
  bookingId!: string;

  @ApiProperty({ 
    enum: ['pending_payment', 'confirmed', 'driver_assigned', 'en_route', 'arrived', 'waiting', 'no_show', 'on_trip', 'completed', 'cancelled_by_user', 'cancelled_by_ops', 'payment_failed'],
    example: 'pending_payment'
  })
  status!: string;

  @ApiProperty({ type: BookingSummaryDto, description: 'Booking summary' })
  summary!: BookingSummaryDto;

  @ApiProperty({ type: PaymentInfoDto, description: 'Payment information for checkout' })
  payment!: PaymentInfoDto;

  @ApiProperty({ example: { cancellation: 'Free until 24h before pickup', includedWait: '60 min after landing' } })
  policySnapshot!: Record<string, string>;

  @ApiProperty({ type: BookingConfirmationDto })
  confirmation!: BookingConfirmationDto;

  @ApiProperty({ example: '2025-11-29T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-11-29T10:30:00.000Z', description: 'Quote expires at this time' })
  expiresAt!: string;
}
