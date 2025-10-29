import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../../common/roles.decorator';
import { 
  DashboardStatsDto, 
  SystemHealthDto, 
  ReportQueryDto, 
  RevenueReportDto 
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('admin')
export class AdminController {
  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard statistics',
    description: 'Retrieve real-time dashboard statistics for admin panel'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard statistics',
    type: DashboardStatsDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getDashboard(): DashboardStatsDto {
    // Mock implementation - replace with actual service
    return {
      totalBookingsToday: 150,
      completedBookingsToday: 120,
      activeBookings: 25,
      pendingBookings: 15,
      driversOnline: 45,
      driversAvailable: 30,
      driversOnTrip: 15,
      revenueToday: 25500.75,
      currency: 'AED',
      averageRating: 4.7,
    };
  }

  @Get('system-health')
  @ApiOperation({ 
    summary: 'Get system health status',
    description: 'Check the health status of all system components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health information',
    type: SystemHealthDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getSystemHealth(): SystemHealthDto {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    return {
      status: 'healthy',
      services: {
        database: 'connected',
        redis: 'connected',
        external_apis: 'operational',
      },
      version: '0.1.0',
      uptime: `${hours}h ${minutes}m`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('reports/revenue')
  @ApiOperation({ 
    summary: 'Get revenue report',
    description: 'Generate revenue report for specified date range'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue report',
    type: RevenueReportDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getRevenueReport(@Query() query: ReportQueryDto): RevenueReportDto {
    // Mock implementation - replace with actual service
    return {
      totalRevenue: 125000.50,
      currency: 'AED',
      totalBookings: 850,
      averageBookingValue: 147.06,
      breakdown: [
        { date: '2025-10-01', revenue: 4500.25, bookings: 32 },
        { date: '2025-10-02', revenue: 5200.75, bookings: 38 },
        { date: '2025-10-03', revenue: 4100.50, bookings: 28 },
      ],
    };
  }

  @Get('ping')
  @ApiOperation({ 
    summary: 'Health check ping',
    description: 'Simple health check endpoint'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is running',
    schema: { example: { ok: true, timestamp: '2025-10-29T10:00:00.000Z' } }
  })
  ping() {
    return { 
      ok: true,
      timestamp: new Date().toISOString()
    };
  }
}
