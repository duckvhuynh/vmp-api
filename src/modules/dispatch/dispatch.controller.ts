import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DispatchService, AssignDriverRequest, AssignDriverResponse } from './services/dispatch.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

/**
 * @deprecated Use /admin/bookings/:id/auto-assign and /admin/bookings/:id/assign-driver instead
 * This controller is kept for backwards compatibility but will be removed in a future version.
 */
@ApiTags('Dispatch (Deprecated)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('assign')
  @ApiOperation({ 
    summary: '[DEPRECATED] Assign driver to booking',
    description: '**DEPRECATED**: Use POST /admin/bookings/:id/auto-assign instead. Automatically assign the best available driver to a confirmed booking.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver assignment result',
    schema: {
      example: {
        success: true,
        assignedDriverId: 'd1234567-89ab-cdef-0123-456789abcdef',
        driverName: 'John Doe',
        driverPhone: '+971501234567',
        message: 'Driver assigned successfully',
        notifiedDrivers: 3
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request or no available drivers' 
  })
  async assignDriver(@Body() request: AssignDriverRequest): Promise<AssignDriverResponse> {
    return this.dispatchService.assignDriver(request);
  }

  @Post('reassign')
  @ApiOperation({ 
    summary: '[DEPRECATED] Reassign driver to booking',
    description: '**DEPRECATED**: Use POST /admin/bookings/:id/unassign-driver then POST /admin/bookings/:id/assign-driver instead. Reassign a different driver to an existing booking.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver reassignment result',
    schema: {
      example: {
        success: true,
        assignedDriverId: 'd1234567-89ab-cdef-0123-456789abcdef',
        driverName: 'Jane Smith',
        driverPhone: '+971501234568',
        message: 'Driver reassigned successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request or driver not available' 
  })
  async reassignDriver(
    @Body() body: { bookingId: string; newDriverId: string }
  ): Promise<AssignDriverResponse> {
    return this.dispatchService.reassignDriver(body.bookingId, body.newDriverId);
  }

  @Get('drivers/:driverId/stats')
  @ApiOperation({ 
    summary: 'Get driver statistics',
    description: 'Retrieve performance statistics for a specific driver'
  })
  @ApiParam({ 
    name: 'driverId', 
    description: 'Driver ID to get stats for',
    example: 'd1234567-89ab-cdef-0123-456789abcdef'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver statistics retrieved successfully',
    schema: {
      example: {
        driverId: 'd1234567-89ab-cdef-0123-456789abcdef',
        name: 'John Doe',
        status: 'online',
        availability: 'available',
        currentLocation: {
          latitude: 25.2532,
          longitude: 55.3644,
          address: 'Dubai Airport Terminal 3'
        },
        stats: {
          totalTrips: 150,
          completedTrips: 145,
          cancelledTrips: 5,
          totalEarnings: 12500.75,
          rating: 4.8,
          totalRatings: 120,
          recentCompletedTrips: 12,
          recentCancelledTrips: 1,
          recentEarnings: 1250.50
        },
        lastActiveAt: '2025-09-04T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Driver not found' 
  })
  async getDriverStats(@Param('driverId') driverId: string) {
    return this.dispatchService.getDriverStats(driverId);
  }
}
