import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, IsNotEmpty, IsUrl, IsEmail } from 'class-validator';
import { BookingStatus } from '../schemas/simple-booking.schema';

// ============ Request DTOs ============

export class CustomerCancelBookingDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Change of plans',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CustomerCreateCheckoutDto {
  @ApiPropertyOptional({
    description: 'URL to redirect on successful payment',
    example: 'https://visitmauritiusparadise.com/booking/success',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect on failed payment',
    example: 'https://visitmauritiusparadise.com/booking/failed',
  })
  @IsOptional()
  @IsUrl()
  failureUrl?: string;
}

// ============ Response DTOs ============

export class CustomerPassengerDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: '+230 5712 3456' })
  phone!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;
}

export class CustomerLocationDto {
  @ApiPropertyOptional({ example: 'airport' })
  type?: string;

  @ApiPropertyOptional({ example: 'SSR International Airport' })
  name?: string;

  @ApiPropertyOptional({ example: 'Plaine Magnien, Mauritius' })
  address?: string;

  @ApiPropertyOptional({ example: -20.4302 })
  latitude?: number;

  @ApiPropertyOptional({ example: 57.6836 })
  longitude?: number;

  @ApiPropertyOptional({ example: 'MRU' })
  airportCode?: string;

  @ApiPropertyOptional({ example: 'International' })
  terminal?: string;
}

export class CustomerVehicleDto {
  @ApiProperty({ example: 'economy' })
  class!: string;

  @ApiProperty({ example: 'Economy Sedan' })
  name!: string;

  @ApiProperty({ example: 4 })
  capacity!: number;

  @ApiProperty({ example: 2 })
  luggageCapacity!: number;
}

export class CustomerPricingDto {
  @ApiProperty({ example: 500 })
  baseFare!: number;

  @ApiPropertyOptional({ example: 350 })
  distanceCharge?: number;

  @ApiPropertyOptional({ example: 100 })
  airportFees?: number;

  @ApiPropertyOptional({ example: 50 })
  surcharges?: number;

  @ApiPropertyOptional({ example: 200 })
  extrasTotal?: number;

  @ApiProperty({ example: 1200 })
  total!: number;

  @ApiProperty({ example: 'MUR' })
  currency!: string;
}

export class CustomerDriverDto {
  @ApiProperty({ example: 'Jean-Pierre D.' })
  name!: string;

  @ApiProperty({ example: '+230 5234 5678' })
  phone!: string;

  @ApiPropertyOptional({ example: 4.8 })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Driver vehicle info',
    example: { make: 'Toyota', model: 'Camry', color: 'Silver', licensePlate: 'MU 1234' },
  })
  vehicle?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
}

export class CustomerPaymentStatusDto {
  @ApiProperty({
    description: 'Whether payment has been made',
    example: false,
  })
  isPaid!: boolean;

  @ApiPropertyOptional({
    description: 'Payment confirmation timestamp',
    example: '2025-12-03T10:05:00.000Z',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'card',
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Whether payment can be made now',
    example: true,
  })
  canPay!: boolean;

  @ApiPropertyOptional({
    description: 'Reason why payment cannot be made',
    example: 'Booking has been cancelled',
  })
  cannotPayReason?: string;
}

export class CustomerBookingEventDto {
  @ApiProperty({ example: 'payment_success' })
  event!: string;

  @ApiProperty({ example: 'confirmed' })
  status!: string;

  @ApiProperty({ example: '2025-12-03T10:05:00.000Z' })
  timestamp!: Date;

  @ApiPropertyOptional({ example: 'Payment confirmed via Fiserv' })
  description?: string;
}

export class CustomerBookingResponseDto {
  @ApiProperty({
    description: 'Unique booking ID',
    example: 'BK-20251203-ABC123',
  })
  bookingId!: string;

  @ApiProperty({
    description: 'Short access code for booking page',
    example: 'X7K9M2P4',
  })
  accessCode!: string;

  @ApiProperty({
    description: 'Current booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  status!: BookingStatus;

  @ApiProperty({
    description: 'Human-readable status',
    example: 'Confirmed',
  })
  statusDisplay!: string;

  @ApiProperty({
    description: 'Status description for customer',
    example: 'Your booking is confirmed. Driver will be assigned soon.',
  })
  statusMessage!: string;

  @ApiProperty({
    description: 'Passenger information',
    type: CustomerPassengerDto,
  })
  passenger!: CustomerPassengerDto;

  @ApiProperty({
    description: 'Pickup location',
    type: CustomerLocationDto,
  })
  origin!: CustomerLocationDto;

  @ApiProperty({
    description: 'Drop-off location',
    type: CustomerLocationDto,
  })
  destination!: CustomerLocationDto;

  @ApiProperty({
    description: 'Scheduled pickup time',
    example: '2025-12-03T10:00:00.000Z',
  })
  pickupAt!: Date;

  @ApiPropertyOptional({
    description: 'Flight number (for airport pickups)',
    example: 'MK501',
  })
  flightNumber?: string;

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
    example: ['child_seat', 'meet_and_greet'],
  })
  extras?: string[];

  @ApiPropertyOptional({
    description: 'Meet & greet sign text',
    example: 'Mr. Doe',
  })
  signText?: string;

  @ApiPropertyOptional({
    description: 'Special notes',
    example: 'Elderly passenger, please assist',
  })
  notes?: string;

  @ApiProperty({
    description: 'Vehicle information',
    type: CustomerVehicleDto,
  })
  vehicle!: CustomerVehicleDto;

  @ApiProperty({
    description: 'Pricing breakdown',
    type: CustomerPricingDto,
  })
  pricing!: CustomerPricingDto;

  @ApiProperty({
    description: 'Payment status',
    type: CustomerPaymentStatusDto,
  })
  payment!: CustomerPaymentStatusDto;

  @ApiPropertyOptional({
    description: 'Assigned driver (only shown when driver is assigned)',
    type: CustomerDriverDto,
  })
  driver?: CustomerDriverDto;

  @ApiProperty({
    description: 'Booking timeline events',
    type: [CustomerBookingEventDto],
  })
  timeline!: CustomerBookingEventDto[];

  @ApiProperty({
    description: 'Whether booking can be cancelled',
    example: true,
  })
  canCancel!: boolean;

  @ApiPropertyOptional({
    description: 'Reason why booking cannot be cancelled',
    example: 'Trip is already in progress',
  })
  cannotCancelReason?: string;

  @ApiProperty({
    description: 'Cancellation policy description',
    example: 'Free cancellation until 24 hours before pickup',
  })
  cancellationPolicy!: string;

  @ApiProperty({
    description: 'Booking creation time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update time',
  })
  updatedAt!: Date;
}

export class CustomerCheckoutResponseDto {
  @ApiProperty({
    description: 'Fiserv Checkout ID',
    example: 'b00c083a-bacf-44aa-b64a-efee15dcb4ba',
  })
  checkoutId!: string;

  @ApiProperty({
    description: 'URL to redirect customer for payment',
    example: 'https://checkout-lane.com/#/?checkoutId=b00c083a-bacf...',
  })
  redirectionUrl!: string;

  @ApiProperty({
    description: 'Booking ID',
    example: 'BK-20251203-ABC123',
  })
  bookingId!: string;

  @ApiProperty({
    description: 'Amount to pay',
    example: 1200,
  })
  amount!: number;

  @ApiProperty({
    description: 'Currency',
    example: 'MUR',
  })
  currency!: string;
}

export class CustomerCancelResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Booking cancelled successfully' })
  message!: string;

  @ApiProperty({ example: 'BK-20251203-ABC123' })
  bookingId!: string;

  @ApiProperty({ example: 'cancelled_by_user' })
  status!: string;

  @ApiPropertyOptional({
    description: 'Refund information (if applicable)',
    example: { amount: 1200, currency: 'MUR', status: 'pending' },
  })
  refund?: {
    amount: number;
    currency: string;
    status: string;
  };
}

export class BookingAccessInfoDto {
  @ApiProperty({
    description: 'Booking ID',
    example: 'BK-20251203-ABC123',
  })
  bookingId!: string;

  @ApiProperty({
    description: 'Short access code',
    example: 'X7K9M2P4',
  })
  accessCode!: string;

  @ApiProperty({
    description: 'Full URL to booking page',
    example: 'https://visitmauritiusparadise.com/my-booking/X7K9M2P4',
  })
  bookingUrl!: string;
}

