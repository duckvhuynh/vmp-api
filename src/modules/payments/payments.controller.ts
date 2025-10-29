import { Body, Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { 
  CreatePaymentIntentDto, 
  PaymentIntentResponseDto,
  ConfirmPaymentDto,
  PaymentConfirmationDto,
  RefundPaymentDto,
  RefundResponseDto,
  PaymentIntentStatus
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create payment intent',
    description: 'Create a payment intent for a booking. This generates a client secret for processing the payment.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment intent created successfully',
    type: PaymentIntentResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createIntent(@Body() dto: CreatePaymentIntentDto): PaymentIntentResponseDto {
    // Mock implementation - replace with actual payment provider integration
    return {
      id: `pi_${Date.now()}`,
      clientSecret: `pi_test_client_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentIntentStatus.PENDING,
      bookingId: dto.bookingId,
      createdAt: new Date().toISOString(),
    };
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Confirm payment',
    description: 'Confirm a payment intent with a payment method'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment confirmed successfully',
    type: PaymentConfirmationDto
  })
  @ApiResponse({ status: 400, description: 'Invalid payment intent or payment method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  confirmPayment(@Body() dto: ConfirmPaymentDto): PaymentConfirmationDto {
    // Mock implementation - replace with actual payment provider integration
    return {
      id: dto.paymentIntentId,
      status: PaymentIntentStatus.SUCCEEDED,
      amount: 3500,
      currency: 'AED',
      bookingId: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5',
      confirmedAt: new Date().toISOString(),
    };
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Refund payment',
    description: 'Refund a payment (full or partial)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Refund processed successfully',
    type: RefundResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid payment intent or refund amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  refundPayment(@Body() dto: RefundPaymentDto): RefundResponseDto {
    // Mock implementation - replace with actual payment provider integration
    return {
      id: `re_${Date.now()}`,
      paymentIntentId: dto.paymentIntentId,
      amount: dto.amount || 3500,
      currency: 'AED',
      status: 'succeeded',
      reason: dto.reason,
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get payment intent details',
    description: 'Retrieve details of a payment intent by ID'
  })
  @ApiParam({ name: 'paymentIntentId', description: 'Payment intent ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment intent details',
    type: PaymentIntentResponseDto
  })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string): PaymentIntentResponseDto {
    // Mock implementation - replace with actual payment provider integration
    return {
      id: paymentIntentId,
      clientSecret: 'pi_test_client_secret',
      amount: 3500,
      currency: 'AED',
      status: PaymentIntentStatus.SUCCEEDED,
      bookingId: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5',
      createdAt: new Date().toISOString(),
    };
  }
}
