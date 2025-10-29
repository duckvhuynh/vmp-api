import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min, IsOptional, IsEnum } from 'class-validator';

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 3500, description: 'Amount in smallest currency unit (e.g., cents for USD)' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: 'AED', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5', description: 'Booking ID' })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CARD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Customer email' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Airport transfer booking', description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty({ example: 'pi_1Px123456789abcdef' })
  id!: string;

  @ApiProperty({ example: 'pi_test_client_secret_abc123' })
  clientSecret!: string;

  @ApiProperty({ example: 3500 })
  amount!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ enum: PaymentIntentStatus, example: PaymentIntentStatus.PENDING })
  status!: PaymentIntentStatus;

  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  bookingId!: string;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  createdAt!: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pi_1Px123456789abcdef' })
  @IsString()
  @IsNotEmpty()
  paymentIntentId!: string;

  @ApiProperty({ example: 'pm_1Px123456789abcdef', description: 'Payment method ID' })
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;
}

export class PaymentConfirmationDto {
  @ApiProperty({ example: 'pi_1Px123456789abcdef' })
  id!: string;

  @ApiProperty({ enum: PaymentIntentStatus, example: PaymentIntentStatus.SUCCEEDED })
  status!: PaymentIntentStatus;

  @ApiProperty({ example: 3500 })
  amount!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5' })
  bookingId!: string;

  @ApiProperty({ example: '2025-10-29T10:05:00.000Z' })
  confirmedAt!: string;
}

export class RefundPaymentDto {
  @ApiProperty({ example: 'pi_1Px123456789abcdef' })
  @IsString()
  @IsNotEmpty()
  paymentIntentId!: string;

  @ApiPropertyOptional({ example: 3500, description: 'Amount to refund (leave empty for full refund)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefundResponseDto {
  @ApiProperty({ example: 're_1Px123456789abcdef' })
  id!: string;

  @ApiProperty({ example: 'pi_1Px123456789abcdef' })
  paymentIntentId!: string;

  @ApiProperty({ example: 3500 })
  amount!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: 'succeeded' })
  status!: string;

  @ApiProperty({ example: 'Customer requested cancellation' })
  reason?: string;

  @ApiProperty({ example: '2025-10-29T10:10:00.000Z' })
  createdAt!: string;
}

