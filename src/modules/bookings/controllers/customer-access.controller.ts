import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerAccessService } from '../services/customer-access.service';
import {
  CustomerBookingResponseDto,
  CustomerCancelBookingDto,
  CustomerCancelResponseDto,
  CustomerCreateCheckoutDto,
  CustomerCheckoutResponseDto,
} from '../dto/customer-access.dto';

/**
 * Customer Booking Access Controller
 * 
 * Public endpoints for customers to access their booking information
 * without requiring authentication. Access is controlled via short
 * access codes embedded in URLs.
 * 
 * URL Format: /my-booking/{accessCode}
 * Access Code: 8-character alphanumeric code (e.g., "X7K9M2P4")
 * 
 * Typical flow:
 * 1. Customer creates booking (accessCode generated automatically)
 * 2. Customer receives booking confirmation with link
 * 3. Customer opens link to view booking status
 * 4. Customer can complete payment or cancel booking
 */
@ApiTags('Customer Booking Access')
@Controller('my-booking')
export class CustomerAccessController {
  constructor(private readonly customerAccessService: CustomerAccessService) {}

  @Get(':accessCode')
  @ApiOperation({
    summary: 'Get booking details by access code',
    description: `
      Retrieve booking details using the short access code.
      
      **Access Code:**
      - 8-character alphanumeric code (e.g., "X7K9M2P4")
      - Case-insensitive
      - Included in booking confirmation email/SMS
      
      **Returns:**
      - Complete booking details
      - Current status with customer-friendly description
      - Driver information (if assigned)
      - Payment status
      - Available actions (pay, cancel)
      - Booking timeline
    `,
  })
  @ApiParam({
    name: 'accessCode',
    description: 'Booking access code (8 characters)',
    example: 'X7K9M2P4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking details retrieved successfully',
    type: CustomerBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found. Please check your booking code.',
  })
  async getBooking(@Param('accessCode') accessCode: string): Promise<CustomerBookingResponseDto> {
    return this.customerAccessService.getBookingByAccessCode(accessCode);
  }

  @Post(':accessCode/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create payment checkout for booking',
    description: `
      Create a payment checkout session for an unpaid booking.
      
      **Flow:**
      1. Call this endpoint to create checkout
      2. Receive redirectionUrl
      3. Redirect customer to Fiserv payment page
      4. After payment, customer is redirected back
      5. Webhook updates booking status automatically
      
      **Cannot pay if:**
      - Payment already completed
      - Booking is cancelled
      - Trip is completed or in progress
    `,
  })
  @ApiParam({
    name: 'accessCode',
    description: 'Booking access code',
    example: 'X7K9M2P4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout created successfully',
    type: CustomerCheckoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment already completed or booking cannot accept payment',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async createCheckout(
    @Param('accessCode') accessCode: string,
    @Body() dto: CustomerCreateCheckoutDto,
  ): Promise<CustomerCheckoutResponseDto> {
    return this.customerAccessService.createCheckout(accessCode, dto);
  }

  @Post(':accessCode/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel booking',
    description: `
      Cancel a booking by the customer.
      
      **Refund Policy:**
      - 24+ hours before pickup: Full refund
      - 2-24 hours before pickup: 50% refund
      - Less than 2 hours: No refund
      
      **Cannot cancel if:**
      - Trip is already in progress
      - Trip is completed
      - Already cancelled
    `,
  })
  @ApiParam({
    name: 'accessCode',
    description: 'Booking access code',
    example: 'X7K9M2P4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking cancelled successfully',
    type: CustomerCancelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking cannot be cancelled (trip in progress, already cancelled, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async cancelBooking(
    @Param('accessCode') accessCode: string,
    @Body() dto: CustomerCancelBookingDto,
  ): Promise<CustomerCancelResponseDto> {
    return this.customerAccessService.cancelBooking(accessCode, dto);
  }

  @Get('id/:bookingId')
  @ApiOperation({
    summary: 'Get booking details by booking ID',
    description: `
      Alternative endpoint to retrieve booking by the full booking ID.
      
      **Booking ID Format:** BK-YYYYMMDD-XXXXXX (e.g., "BK-20251203-ABC123")
      
      This is useful when customer has the booking ID from email but not the access code.
    `,
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Full booking ID',
    example: 'BK-20251203-ABC123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking details retrieved successfully',
    type: CustomerBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async getBookingById(@Param('bookingId') bookingId: string): Promise<CustomerBookingResponseDto> {
    return this.customerAccessService.getBookingByBookingId(bookingId);
  }
}

