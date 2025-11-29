import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { FiservService } from './services/fiserv.service';
import {
  CreateCheckoutDto,
  CheckoutResponseDto,
  CheckoutDetailsDto,
  FiservWebhookPayloadDto,
  WebhookResponseDto,
} from './dto/fiserv-checkout.dto';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  RefundPaymentDto,
  RefundResponseDto,
  PaymentIntentStatus,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly fiservService: FiservService) {}

  // ============ Fiserv Checkout Endpoints ============

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment checkout',
    description: `
      Create a Fiserv hosted checkout session for a booking.
      
      **Flow:**
      1. Call this endpoint with booking details
      2. Receive \`redirectionUrl\` 
      3. Redirect customer to \`redirectionUrl\` for payment
      4. Fiserv handles the payment securely
      5. Customer is redirected to success/failure URL
      6. Webhook updates booking status
      
      **Supported currencies:** MUR (Mauritian Rupee)
      
      **Reference:** [Fiserv Checkout API](https://docs.fiserv.dev/public/reference/checkouts)
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Checkout session created successfully',
    type: CheckoutResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request or booking not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Fiserv API error' })
  async createCheckout(@Body() dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    return this.fiservService.createCheckout(dto);
  }

  @Get('checkout/:checkoutId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get checkout details',
    description: `
      Retrieve details of a checkout session from Fiserv.
      Use this to check payment status manually.
      
      **Reference:** [Fiserv Get Checkout](https://docs.fiserv.dev/public/reference/get-checkouts-id)
    `,
  })
  @ApiParam({ name: 'checkoutId', description: 'Fiserv Checkout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout details retrieved successfully',
    type: CheckoutDetailsDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Checkout not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getCheckout(@Param('checkoutId') checkoutId: string): Promise<CheckoutDetailsDto> {
    return this.fiservService.getCheckout(checkoutId);
  }

  @Post('webhook/fiserv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fiserv webhook handler',
    description: `
      Webhook endpoint for Fiserv to notify transaction status updates.
      
      **This endpoint is called by Fiserv, not by frontend.**
      
      Status updates:
      - APPROVED → Booking confirmed
      - DECLINED/FAILED → Payment failed
      - WAITING → Processing
    `,
  })
  @ApiHeader({
    name: 'x-fiserv-signature',
    description: 'HMAC signature for webhook verification',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid signature or payload' })
  async handleFiservWebhook(
    @Body() payload: FiservWebhookPayloadDto,
    @Headers('x-fiserv-signature') signature?: string,
    @Res() res?: Response,
  ): Promise<WebhookResponseDto> {
    const result = await this.fiservService.handleWebhook(payload, signature);
    
    // Always return 200 to Fiserv to acknowledge receipt
    if (res) {
      res.status(HttpStatus.OK).json(result);
    }
    
    return {
      success: result.success,
      message: result.message,
      bookingId: result.bookingId,
      transactionStatus: payload.transactionStatus,
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check payment service status',
    description: 'Check if the Fiserv payment gateway is configured and available',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service status',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        provider: { type: 'string', example: 'Fiserv' },
        message: { type: 'string' },
      },
    },
  })
  getStatus() {
    const isConfigured = this.fiservService.isConfigured();
    return {
      available: isConfigured,
      provider: 'Fiserv',
      message: isConfigured
        ? 'Payment gateway is configured and available'
        : 'Payment gateway is not configured. Set FISERV_* environment variables.',
    };
  }

  // ============ Admin Payment Endpoints ============

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refund payment (Admin)',
    description: 'Process a refund for a payment. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
    type: RefundResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payment or refund amount' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  refundPayment(@Body() dto: RefundPaymentDto): RefundResponseDto {
    // TODO: Implement actual refund via Fiserv API
    // For now, return mock response
    return {
      id: `re_${Date.now()}`,
      paymentIntentId: dto.paymentIntentId,
      amount: dto.amount || 0,
      currency: 'MUR',
      status: 'succeeded',
      reason: dto.reason,
      createdAt: new Date().toISOString(),
    };
  }

  // ============ Legacy Endpoints (for backwards compatibility) ============

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[DEPRECATED] Create payment intent',
    description: '**DEPRECATED**: Use POST /payments/checkout instead. This endpoint is kept for backwards compatibility.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment intent created',
    type: PaymentIntentResponseDto,
  })
  createIntent(@Body() dto: CreatePaymentIntentDto): PaymentIntentResponseDto {
    // Legacy mock implementation - redirect to checkout in production
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

  @Get(':paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment details',
    description: 'Retrieve payment details by ID. Supports both legacy payment intents and Fiserv checkout IDs.',
  })
  @ApiParam({ name: 'paymentIntentId', description: 'Payment Intent ID or Checkout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details',
    type: PaymentIntentResponseDto,
  })
  async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string): Promise<PaymentIntentResponseDto | CheckoutDetailsDto> {
    // Try Fiserv checkout first
    if (paymentIntentId.includes('-') && paymentIntentId.length > 30) {
      try {
        return await this.fiservService.getCheckout(paymentIntentId);
      } catch {
        // Fall through to legacy mock
      }
    }

    // Legacy mock response
    return {
      id: paymentIntentId,
      clientSecret: 'pi_test_client_secret',
      amount: 0,
      currency: 'MUR',
      status: PaymentIntentStatus.PENDING,
      bookingId: '',
      createdAt: new Date().toISOString(),
    };
  }
}
