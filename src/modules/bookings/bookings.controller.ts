import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, BookingResponseDto } from './dto/create-booking.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a booking from a quote',
    description: `
      Create a new booking using a quote ID. This is the main endpoint for customer booking flow.
      
      **Flow:**
      1. Get a quote using POST /quotes
      2. Select a vehicle class from the quote options
      3. Create booking with this endpoint
      4. Use the returned payment info to create a checkout
      
      **Required:**
      - Valid quoteId (not expired, not used)
      - selectedVehicleClass (must match one from the quote)
      - Passenger details
      - Contact information
      
      **Returns:**
      - Booking ID for tracking
      - Payment information for checkout
      - Booking summary
    `
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Booking created successfully, awaiting payment',
    type: BookingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Quote expired, already used, or invalid vehicle class' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Quote not found' 
  })
  create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get booking details',
    description: 'Retrieve booking details by booking ID (e.g., BK-20251129-ABC123) or MongoDB ObjectId'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Booking ID or MongoDB ObjectId',
    example: 'BK-20251129-ABC123'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Booking details',
    schema: {
      example: {
        bookingId: 'BK-20251129-ABC123',
        status: 'pending_payment',
        passenger: { firstName: 'John', lastName: 'Doe', phone: '+230 5712 3456', email: 'john@example.com' },
        origin: { type: 'airport', name: 'MRU Airport', address: 'Plaine Magnien' },
        destination: { type: 'address', name: 'Le Morne Beach' },
        pickupAt: '2025-12-01T10:00:00.000Z',
        vehicle: { class: 'economy', name: 'Economy Sedan' },
        pricing: { total: 1200, currency: 'MUR' },
        payment: { confirmed: false },
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Booking not found' 
  })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancel a booking',
    description: `
      Cancel a booking by ID.
      
      **Refund Policy:**
      - 24+ hours before pickup: Full refund
      - 2-24 hours before pickup: 50% refund
      - Less than 2 hours: No refund
      
      **Cannot cancel if booking is:**
      - On trip
      - Already completed
      - Already cancelled
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Booking ID',
    example: 'BK-20251129-ABC123'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Booking cancelled successfully',
    schema: {
      example: {
        bookingId: 'BK-20251129-ABC123',
        status: 'cancelled_by_user',
        refund: { amount: 1200, currency: 'MUR', status: 'pending' },
        message: 'Booking cancelled. Refund of 1200 MUR will be processed.'
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Booking cannot be cancelled (on trip, completed, etc.)' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Booking not found' 
  })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
