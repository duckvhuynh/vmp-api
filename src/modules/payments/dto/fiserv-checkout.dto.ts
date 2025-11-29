import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';

// ============ Enums ============

export enum FiservTransactionType {
  SALE = 'SALE',
  PREAUTH = 'PREAUTH',
  POSTAUTH = 'POSTAUTH',
  REFUND = 'REFUND',
}

export enum FiservTransactionStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  WAITING = 'WAITING',
  FAILED = 'FAILED',
}

export enum FiservPaymentMethod {
  CARDS = 'Cards',
  PAYPAL = 'PayPal',
  SEPA = 'SEPA',
  KLARNA = 'Klarna',
}

// ============ Request DTOs ============

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Booking ID to associate with payment', example: 'BK-20251129-ABC123' })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ description: 'Total amount to charge', example: 1200.50 })
  @IsNumber()
  @Min(0.01)
  total!: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'MUR', default: 'MUR' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({ description: 'Merchant transaction ID (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  merchantTransactionId?: string;

  @ApiPropertyOptional({ description: 'URL to redirect on successful payment' })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL to redirect on failed payment' })
  @IsOptional()
  @IsUrl()
  failureUrl?: string;

  @ApiPropertyOptional({ description: 'Customer email for receipt' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Payment description', example: 'Airport transfer - MRU to Le Morne' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: FiservPaymentMethod,
    description: 'Pre-selected payment method',
    default: FiservPaymentMethod.CARDS,
  })
  @IsOptional()
  @IsEnum(FiservPaymentMethod)
  paymentMethod?: FiservPaymentMethod;

  @ApiPropertyOptional({ description: 'Locale for checkout page', example: 'en_GB', default: 'en_GB' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class GetCheckoutDto {
  @ApiProperty({ description: 'Fiserv Checkout ID' })
  @IsString()
  @IsNotEmpty()
  checkoutId!: string;
}

// ============ Response DTOs ============

export class CheckoutResponseDto {
  @ApiProperty({ example: 'b00c083a-bacf-44aa-b64a-efee15dcb4ba' })
  checkoutId!: string;

  @ApiProperty({ example: 'https://checkout-lane.com/#/?checkoutId=b00c083a-bacf...' })
  redirectionUrl!: string;

  @ApiProperty({ example: 'BK-20251129-ABC123' })
  bookingId!: string;

  @ApiProperty({ example: 'TXN-20251129-123456' })
  merchantTransactionId!: string;

  @ApiProperty({ example: 1200.50 })
  amount!: number;

  @ApiProperty({ example: 'MUR' })
  currency!: string;

  @ApiProperty({ example: 'WAITING' })
  status!: string;

  @ApiProperty({ example: '2025-11-29T10:00:00.000Z' })
  createdAt!: string;
}

export class CheckoutDetailsDto {
  @ApiProperty({ example: 'b00c083a-bacf-44aa-b64a-efee15dcb4ba' })
  checkoutId!: string;

  @ApiProperty({ example: '120995000' })
  storeId!: string;

  @ApiProperty({ example: 'TXN-20251129-123456' })
  merchantTransactionId?: string;

  @ApiProperty({ enum: FiservTransactionType, example: FiservTransactionType.SALE })
  transactionType!: FiservTransactionType;

  @ApiProperty({ example: 1200.50 })
  amount!: number;

  @ApiProperty({ example: 'MUR' })
  currency!: string;

  @ApiProperty({ enum: FiservTransactionStatus, example: FiservTransactionStatus.APPROVED })
  transactionStatus!: FiservTransactionStatus;

  @ApiPropertyOptional({ example: 'Y:758396:4632773344:YYYM:032018' })
  approvalCode?: string;

  @ApiPropertyOptional({ example: '84632773344' })
  ipgTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: { cardNumber: '123456******7890', brand: 'VISA' },
  })
  paymentMethodUsed?: Record<string, any>;

  @ApiProperty({ example: '2025-11-29T10:05:00.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ example: '2025-11-29T10:05:30.000Z' })
  completedAt?: string;
}

// ============ Webhook DTOs ============

export class FiservWebhookPayloadDto {
  @ApiProperty({ example: 'b00c083a-bacf-44aa-b64a-efee15dcb4ba' })
  checkoutId!: string;

  @ApiProperty({ example: 'TXN-20251129-123456' })
  merchantTransactionId!: string;

  @ApiProperty({ example: '120995000' })
  storeId!: string;

  @ApiProperty({ enum: FiservTransactionType })
  transactionType!: FiservTransactionType;

  @ApiProperty()
  approvedAmount!: {
    total: number;
    currency: string;
    components?: {
      subtotal?: number;
      vatAmount?: number;
      shipping?: number;
    };
  };

  @ApiProperty({ enum: FiservTransactionStatus })
  transactionStatus!: FiservTransactionStatus;

  @ApiPropertyOptional()
  paymentMethodUsed?: {
    cards?: {
      cardNumber: string;
      expiryDate: { month: string; year: string };
      brand: string;
    };
  };

  @ApiPropertyOptional()
  ipgTransactionDetails?: {
    ipgTransactionId: string;
    transactionStatus: string;
    approvalCode: string;
  };
}

export class WebhookResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Webhook processed successfully' })
  message!: string;

  @ApiPropertyOptional({ example: 'BK-20251129-ABC123' })
  bookingId?: string;

  @ApiPropertyOptional({ example: 'APPROVED' })
  transactionStatus?: string;
}

