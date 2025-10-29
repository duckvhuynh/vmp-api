import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { DriversService } from './services/drivers.service';
import { 
  UpdateDriverLocationDto,
  UpdateDriverStatusDto,
  AcceptJobDto,
  DeclineJobDto,
  UpdateJobStatusDto,
  DriverProfileDto,
  DriverJobsListDto
} from './dto/driver.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers/me')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('profile')
  @ApiOperation({ 
    summary: 'Get driver profile',
    description: 'Retrieve the authenticated driver\'s profile information including stats and vehicle details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver profile retrieved successfully',
    type: DriverProfileDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver not found' 
  })
  async getProfile(@Request() req): Promise<DriverProfileDto> {
    const driverId = req.user.driverId; // Assuming JWT contains driverId
    return this.driversService.getDriverProfile(driverId);
  }

  @Put('location')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Update driver location',
    description: 'Update the driver\'s current location with GPS coordinates and optional metadata'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Location updated successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver not found' 
  })
  async updateLocation(
    @Request() req,
    @Body() dto: UpdateDriverLocationDto
  ): Promise<void> {
    const driverId = req.user.driverId;
    return this.driversService.updateDriverLocation(driverId, dto);
  }

  @Put('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Update driver status',
    description: 'Update the driver\'s availability status (online/offline/busy/break)'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Status updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid status transition' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver not found' 
  })
  async updateStatus(
    @Request() req,
    @Body() dto: UpdateDriverStatusDto
  ): Promise<void> {
    const driverId = req.user.driverId;
    return this.driversService.updateDriverStatus(driverId, dto);
  }

  @Get('jobs')
  @ApiOperation({ 
    summary: 'Get driver jobs',
    description: 'Retrieve all assigned jobs for the authenticated driver including pending and active bookings'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Jobs retrieved successfully',
    type: DriverJobsListDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver not found' 
  })
  async getJobs(@Request() req): Promise<DriverJobsListDto> {
    const driverId = req.user.driverId;
    return this.driversService.getDriverJobs(driverId);
  }

  @Post('jobs/:bookingId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Accept a job',
    description: 'Accept an assigned booking and update driver status to busy'
  })
  @ApiParam({ 
    name: 'bookingId', 
    description: 'Booking ID to accept',
    example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Job accepted successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot accept job (invalid status, not assigned, etc.)' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver or booking not found' 
  })
  async acceptJob(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() dto: Omit<AcceptJobDto, 'bookingId'>
  ): Promise<void> {
    const driverId = req.user.driverId;
    return this.driversService.acceptJob(driverId, { ...dto, bookingId });
  }

  @Post('jobs/:bookingId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Decline a job',
    description: 'Decline an assigned booking with a reason'
  })
  @ApiParam({ 
    name: 'bookingId', 
    description: 'Booking ID to decline',
    example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Job declined successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot decline job (invalid status, not assigned, etc.)' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver or booking not found' 
  })
  async declineJob(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() dto: Omit<DeclineJobDto, 'bookingId'>
  ): Promise<void> {
    const driverId = req.user.driverId;
    return this.driversService.declineJob(driverId, { ...dto, bookingId });
  }

  @Put('jobs/:bookingId/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Update job status',
    description: 'Update the status of an active booking (en_route, arrived, waiting, on_trip, completed)'
  })
  @ApiParam({ 
    name: 'bookingId', 
    description: 'Booking ID to update',
    example: 'a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Job status updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid status transition or booking not assigned to driver' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Driver or booking not found' 
  })
  async updateJobStatus(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() dto: Omit<UpdateJobStatusDto, 'bookingId'>
  ): Promise<void> {
    const driverId = req.user.driverId;
    return this.driversService.updateJobStatus(driverId, { ...dto, bookingId });
  }
}
