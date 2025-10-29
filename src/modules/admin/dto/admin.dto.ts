import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class DashboardStatsDto {
  @ApiProperty({ example: 150, description: 'Total bookings today' })
  totalBookingsToday!: number;

  @ApiProperty({ example: 120, description: 'Completed bookings today' })
  completedBookingsToday!: number;

  @ApiProperty({ example: 25, description: 'Active bookings right now' })
  activeBookings!: number;

  @ApiProperty({ example: 15, description: 'Pending bookings' })
  pendingBookings!: number;

  @ApiProperty({ example: 45, description: 'Total drivers online' })
  driversOnline!: number;

  @ApiProperty({ example: 30, description: 'Available drivers' })
  driversAvailable!: number;

  @ApiProperty({ example: 15, description: 'Drivers on trip' })
  driversOnTrip!: number;

  @ApiProperty({ example: 25500.75, description: 'Total revenue today' })
  revenueToday!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: 4.7, description: 'Average rating' })
  averageRating!: number;
}

export class SystemHealthDto {
  @ApiProperty({ example: 'healthy' })
  status!: string;

  @ApiProperty({ example: { database: 'connected', redis: 'connected', external_apis: 'operational' } })
  services!: Record<string, string>;

  @ApiProperty({ example: '1.5.0' })
  version!: string;

  @ApiProperty({ example: '72h 15m' })
  uptime!: string;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  timestamp!: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2025-10-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-10-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'daily', enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional()
  @IsString()
  granularity?: string;
}

export class RevenueReportDto {
  @ApiProperty({ example: 125000.50 })
  totalRevenue!: number;

  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: 850 })
  totalBookings!: number;

  @ApiProperty({ example: 147.06 })
  averageBookingValue!: number;

  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string', example: '2025-10-01' },
        revenue: { type: 'number', example: 4500.25 },
        bookings: { type: 'number', example: 32 }
      }
    }
  })
  breakdown!: Array<{ date: string; revenue: number; bookings: number }>;
}

