import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingResponseDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking from a quote', description: 'Creates a booking, returns policy snapshot and confirmation message.' })
  @ApiResponse({ status: 201, description: 'Booking created', type: BookingResponseDto })
  create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Booking details', schema: { example: { id: '...', status: 'confirmed' } } })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ description: 'Booking cancelled', schema: { example: { id: '...', status: 'cancelled_by_user', refund: { amount: 0, currency: 'USD' } } } })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
