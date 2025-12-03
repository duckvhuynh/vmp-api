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
import { DriverAccessService } from '../services/driver-access.service';
import {
  DriverBookingResponseDto,
  DriverAcceptBookingDto,
  DriverDeclineBookingDto,
  DriverUpdateStatusDto,
  DriverUpdateLocationDto,
  DriverActionResponseDto,
} from '../dto/driver-access.dto';

/**
 * Driver Access Controller
 * 
 * Public endpoints for drivers to access and manage their assigned bookings
 * without requiring authentication. Access is controlled via secure tokens
 * embedded in URLs shared with drivers.
 * 
 * Token Format: base64url(payload).signature
 * Payload contains: bookingId, driverId, timestamp, expiresAt
 * 
 * Typical flow:
 * 1. Admin assigns driver to booking
 * 2. System generates secure driver link (via admin-bookings service)
 * 3. Driver receives link (via SMS, WhatsApp, email, etc.)
 * 4. Driver opens link, sees booking details
 * 5. Driver can accept/decline, update status, report location
 */
@ApiTags('Driver Access')
@Controller('driver-access')
export class DriverAccessController {
  constructor(private readonly driverAccessService: DriverAccessService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Get booking details by driver access token',
    description: `
      Retrieve booking details using the secure driver access token.
      
      **Token Source:**
      The token is provided in the driver link generated when a driver is assigned to a booking.
      
      **Returns:**
      - Complete booking details relevant for the driver
      - Passenger contact info
      - Pickup and drop-off locations with coordinates
      - Flight information (if applicable)
      - Available actions based on current status
      
      **Token Validation:**
      - Token signature is verified
      - Token never expires - valid for the lifetime of the booking
      - Driver must be the one assigned to the booking
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token from the driver link',
    example: 'eyJib29raW5nSWQiOiJCSy0yMDI1MTIwMy1BQkMxMjMi...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking details retrieved successfully',
    type: DriverBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async getBooking(@Param('token') token: string): Promise<DriverBookingResponseDto> {
    return this.driverAccessService.getBookingByToken(token);
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept the assigned booking',
    description: `
      Driver accepts the booking assignment.
      
      **Status Transition:**
      driver_assigned → confirmed
      
      **Effects:**
      - Booking status changes to confirmed
      - Driver availability is set to 'assigned'
      - Event is logged in booking history
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking accepted successfully',
    type: DriverBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking is not in a status that can be accepted',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async acceptBooking(
    @Param('token') token: string,
    @Body() dto: DriverAcceptBookingDto,
  ): Promise<DriverBookingResponseDto> {
    return this.driverAccessService.acceptBooking(token, dto);
  }

  @Post(':token/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline the assigned booking',
    description: `
      Driver declines the booking assignment.
      
      **Status Transition:**
      driver_assigned → driver_declined
      
      **Effects:**
      - Booking status changes to driver_declined
      - Driver is unassigned from the booking
      - Driver availability is reset to 'available'
      - Admin/dispatcher is notified to reassign
      
      **Required:**
      - Reason for declining must be provided
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking declined successfully',
    type: DriverActionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking is not in a status that can be declined',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async declineBooking(
    @Param('token') token: string,
    @Body() dto: DriverDeclineBookingDto,
  ): Promise<DriverActionResponseDto> {
    return this.driverAccessService.declineBooking(token, dto);
  }

  @Post(':token/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update booking status',
    description: `
      Driver updates the booking status as they progress through the trip.
      
      **Valid Status Transitions:**
      - confirmed/driver_assigned → en_route (driver is heading to pickup)
      - en_route → arrived (driver has arrived at pickup location)
      - arrived → waiting (driver is waiting for passenger)
      - arrived/waiting → on_trip (passenger picked up, trip started)
      - arrived/waiting → no_show (passenger did not show up)
      - on_trip → completed (trip completed, passenger dropped off)
      
      **Optional:**
      - Driver can include their current coordinates
      - Notes can be added for each status update
      
      **Effects:**
      - Booking status is updated
      - Event with timestamp is logged
      - Driver stats are updated on completion
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status updated successfully',
    type: DriverBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async updateStatus(
    @Param('token') token: string,
    @Body() dto: DriverUpdateStatusDto,
  ): Promise<DriverBookingResponseDto> {
    return this.driverAccessService.updateBookingStatus(token, dto);
  }

  @Post(':token/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update driver location',
    description: `
      Driver reports their current location.
      
      **Use Cases:**
      - Real-time tracking during en_route and on_trip status
      - Location verification at pickup/dropoff
      
      **Optional Fields:**
      - address: Human-readable address
      - heading: Direction of travel (0-360 degrees)
      - speed: Current speed in km/h
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location updated successfully',
    type: DriverActionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async updateLocation(
    @Param('token') token: string,
    @Body() dto: DriverUpdateLocationDto,
  ): Promise<DriverActionResponseDto> {
    return this.driverAccessService.updateDriverLocation(token, dto);
  }

  @Get(':token/bookings')
  @ApiOperation({
    summary: 'Get all active bookings for the driver',
    description: `
      Retrieve all current/upcoming bookings assigned to the driver.
      
      **Returns:**
      - List of bookings in active statuses (assigned, confirmed, en_route, arrived, waiting, on_trip)
      - Sorted by pickup time (earliest first)
      
      **Note:**
      This endpoint requires a valid token from any of the driver's assigned bookings.
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Driver access token from any assigned booking',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver bookings retrieved successfully',
    type: [DriverBookingResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async getDriverBookings(@Param('token') token: string): Promise<DriverBookingResponseDto[]> {
    return this.driverAccessService.getDriverBookings(token);
  }
}

