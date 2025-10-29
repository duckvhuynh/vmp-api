import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsDateString } from 'class-validator';

export class StripeWebhookDto {
  @ApiProperty({ example: 'payment_intent.succeeded' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ 
    example: { 
      object: { 
        id: 'pi_1Px123456789abcdef', 
        amount: 3500, 
        currency: 'AED',
        status: 'succeeded'
      } 
    } 
  })
  @IsObject()
  data!: Record<string, any>;

  @ApiPropertyOptional({ example: 'evt_1Px123456789abcdef' })
  @IsOptional()
  @IsString()
  id?: string;
}

export class FlightUpdateDto {
  @ApiProperty({ example: 'MK015' })
  @IsString()
  @IsNotEmpty()
  flightNumber!: string;

  @ApiProperty({ example: 'DELAYED', enum: ['ON_TIME', 'DELAYED', 'CANCELLED', 'LANDED'] })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ example: '2025-10-29T11:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @ApiPropertyOptional({ example: '2025-10-29T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  actualArrival?: string;

  @ApiPropertyOptional({ example: 'T3' })
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiPropertyOptional({ example: 'A12' })
  @IsOptional()
  @IsString()
  gate?: string;

  @ApiPropertyOptional({ example: 'B5' })
  @IsOptional()
  @IsString()
  baggageClaim?: string;
}

export class SmsStatusDto {
  @ApiProperty({ example: 'sms_abc123456789' })
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @ApiProperty({ example: 'delivered', enum: ['queued', 'sent', 'delivered', 'failed', 'undelivered'] })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ example: '+230 1234 5678' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: 'Successfully delivered' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: '2025-10-29T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class WebhookAcknowledgementDto {
  @ApiProperty({ example: true })
  received!: boolean;

  @ApiPropertyOptional({ example: '2025-10-29T10:00:00.000Z' })
  timestamp?: string;

  @ApiPropertyOptional({ example: 'evt_1Px123456789abcdef' })
  eventId?: string;
}

