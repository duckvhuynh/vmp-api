import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class ContactDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+230 1234 5678' })
  @IsString()
  phone!: string;
}

class FlightDto {
  @ApiProperty({ example: 'MK015' })
  @IsString()
  number!: string;

  @ApiProperty({ example: '2025-09-04' })
  @IsDateString()
  date!: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1' })
  @IsString()
  @IsNotEmpty()
  quoteId!: string;

  @ApiProperty({ type: PassengerDto })
  @ValidateNested()
  @Type(() => PassengerDto)
  passenger!: PassengerDto;

  @ApiProperty({ type: ContactDto })
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @ApiProperty({ required: false, type: FlightDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightDto)
  flight?: FlightDto;

  @ApiProperty({ required: false, example: 'Mr. John Doe' })
  @IsOptional()
  @IsString()
  signText?: string;

  @ApiProperty({ required: false, example: 'Please wait near exit A2' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, type: [String], example: ['child_seat'] })
  @IsOptional()
  @IsArray()
  extras?: string[];

  @ApiProperty({ example: 'pm_1Px...' })
  @IsString()
  paymentMethodId!: string;
}

export class BookingConfirmationDto {
  @ApiProperty({ example: 'Booking created, awaiting payment confirmation' })
  message!: string;
}

export class BookingResponseDto {
  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  bookingId!: string;
  @ApiProperty({ enum: [
    'pending_payment','confirmed','driver_assigned','en_route','arrived','waiting','no_show','on_trip','completed','cancelled_by_user','cancelled_by_ops','payment_failed'
  ], example: 'pending_payment' })
  status!: string;
  @ApiProperty({ example: { cancellation: 'Free until 24h', includedWait: '60 min after ATA' } })
  policySnapshot!: Record<string, string>;
  @ApiProperty({ type: BookingConfirmationDto })
  confirmation!: BookingConfirmationDto;
}
