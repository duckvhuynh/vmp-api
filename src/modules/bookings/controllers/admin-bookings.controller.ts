import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../../common/roles.guard';
import { Roles } from '../../../common/roles.decorator';
import { AdminBookingsService } from '../services/admin-bookings.service';
import {
  AdminCreateBookingDto,
  BookingQueryDto,
  UpdateBookingStatusDto,
  AssignDriverDto,
  AdminUpdateBookingDto,
  AdminCancelBookingDto,
  AddBookingEventDto,
  BookingListResponseDto,
  BookingDetailResponseDto,
  BookingStatsDto,
  BookingListItemDto,
} from '../dto/admin-booking.dto';

@ApiTags('Admin - Bookings')
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @Post()
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new booking',
    description: `
      Create a booking manually (for phone bookings, walk-in customers, or on behalf of users).
      
      **Use cases:**
      - Customer calls in to book
      - Walk-in customer at counter
      - Admin creates booking on behalf of customer
      - Manual booking with custom pricing
      
      **Notes:**
      - If no userId is provided, the booking is associated with the admin user
      - Status defaults to 'confirmed' for admin bookings
      - If assignedDriverId is provided, status is set to 'driver_assigned'
      - Set paymentConfirmed: true for cash payments or pre-paid bookings
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking created successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid booking data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin/Dispatcher access required' })
  async create(
    @Body() dto: AdminCreateBookingDto,
    @Req() req: Request,
  ): Promise<BookingDetailResponseDto> {
    const user = req.user as { userId: string };
    return this.adminBookingsService.create(dto, user.userId);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get all bookings with filtering and pagination',
    description: 'Retrieve a paginated list of bookings with comprehensive filtering options',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
    type: BookingListResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin/Dispatcher access required' })
  async findAll(@Query() query: BookingQueryDto): Promise<BookingListResponseDto> {
    return this.adminBookingsService.findAll(query);
  }

  @Get('stats')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get booking statistics',
    description: 'Retrieve comprehensive booking statistics for dashboard',
  })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: BookingStatsDto,
  })
  async getStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<BookingStatsDto> {
    return this.adminBookingsService.getStats(fromDate, toDate);
  }

  @Get('upcoming')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get upcoming bookings',
    description: 'Retrieve bookings scheduled within the specified time window',
  })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours ahead to look (default: 24)', example: 24 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming bookings retrieved successfully',
    type: [BookingListItemDto],
  })
  async getUpcoming(@Query('hours') hours?: number): Promise<BookingListItemDto[]> {
    return this.adminBookingsService.findUpcoming(hours || 24);
  }

  @Get('attention')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get bookings requiring attention',
    description: 'Retrieve bookings that need admin attention (unassigned, declined, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings requiring attention retrieved successfully',
    type: [BookingListItemDto],
  })
  async getRequiringAttention(): Promise<BookingListItemDto[]> {
    return this.adminBookingsService.findRequiringAttention();
  }

  @Get('driver/:driverId')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get bookings for a specific driver',
    description: 'Retrieve all bookings assigned to a specific driver',
  })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by booking status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver bookings retrieved successfully',
    type: [BookingListItemDto],
  })
  async getByDriver(
    @Param('driverId') driverId: string,
    @Query('status') status?: string,
  ): Promise<BookingListItemDto[]> {
    return this.adminBookingsService.findByDriver(driverId, status as any);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get booking details',
    description: 'Retrieve detailed information about a specific booking',
  })
  @ApiParam({ name: 'id', description: 'Booking ID (MongoDB ObjectId or bookingId)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking details retrieved successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  async findOne(@Param('id') id: string): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Update booking details',
    description: 'Update booking information (passenger details, pickup time, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking updated successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBookingDto,
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Update booking status',
    description: 'Change the status of a booking with validation of allowed transitions',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking status updated successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.updateStatus(id, dto);
  }

  @Post(':id/assign-driver')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Assign driver to booking',
    description: 'Assign a specific driver to handle the booking',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver assigned successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot assign driver to booking with current status' })
  async assignDriver(
    @Param('id') id: string,
    @Body() dto: AssignDriverDto,
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.assignDriver(id, dto);
  }

  @Post(':id/unassign-driver')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unassign driver from booking',
    description: 'Remove the currently assigned driver from the booking',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver unassigned successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No driver assigned to this booking' })
  async unassignDriver(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.unassignDriver(id, body.reason);
  }

  @Post(':id/cancel')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel booking',
    description: 'Cancel a booking with reason and optional refund amount',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking cancelled successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot cancel booking with current status' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: AdminCancelBookingDto,
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.cancel(id, dto);
  }

  @Post(':id/events')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add event to booking',
    description: 'Add a custom event/note to the booking timeline',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event added successfully',
    type: BookingDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking not found' })
  async addEvent(
    @Param('id') id: string,
    @Body() dto: AddBookingEventDto,
  ): Promise<BookingDetailResponseDto> {
    return this.adminBookingsService.addEvent(id, dto);
  }
}

