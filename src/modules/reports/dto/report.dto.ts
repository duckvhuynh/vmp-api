import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ReportUnit {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum ReportType {
  OVERVIEW = 'overview',
  BOOKINGS = 'bookings',
  REVENUE = 'revenue',
  DRIVERS = 'drivers',
}

// ===== Request DTOs =====

export class DashboardReportQueryDto {
  @ApiProperty({
    enum: ReportUnit,
    description: 'Time unit for aggregation',
    example: ReportUnit.DAY,
  })
  @IsNotEmpty()
  @IsEnum(ReportUnit)
  unit!: ReportUnit;

  @ApiProperty({
    enum: ReportType,
    description: 'Type of report to generate',
    example: ReportType.OVERVIEW,
  })
  @IsNotEmpty()
  @IsEnum(ReportType)
  report_type!: ReportType;

  @ApiProperty({
    description: 'Start date for the report (ISO 8601 format)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  from_date!: string;

  @ApiProperty({
    description: 'End date for the report (ISO 8601 format)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsNotEmpty()
  @IsDateString()
  to_date!: string;
}

// ===== Response DTOs =====

export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Date/period label', example: '2025-01-15' })
  label!: string;

  @ApiProperty({ description: 'Start of the period (ISO date)', example: '2025-01-15T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ description: 'End of the period (ISO date)', example: '2025-01-15T23:59:59.999Z' })
  periodEnd!: string;

  @ApiProperty({ description: 'Value for this period', example: 42 })
  value!: number;
}

export class BookingStatusBreakdownDto {
  @ApiProperty({ example: 10 })
  pending_payment!: number;

  @ApiProperty({ example: 25 })
  confirmed!: number;

  @ApiProperty({ example: 15 })
  driver_assigned!: number;

  @ApiProperty({ example: 5 })
  en_route!: number;

  @ApiProperty({ example: 3 })
  arrived!: number;

  @ApiProperty({ example: 2 })
  waiting!: number;

  @ApiProperty({ example: 8 })
  on_trip!: number;

  @ApiProperty({ example: 150 })
  completed!: number;

  @ApiProperty({ example: 5 })
  cancelled_by_user!: number;

  @ApiProperty({ example: 2 })
  cancelled_by_ops!: number;

  @ApiProperty({ example: 3 })
  payment_failed!: number;

  @ApiProperty({ example: 1 })
  no_show!: number;

  @ApiProperty({ example: 1 })
  driver_declined!: number;
}

export class BookingsReportDto {
  @ApiProperty({ description: 'Total number of bookings', example: 230 })
  totalBookings!: number;

  @ApiProperty({ description: 'Completed bookings', example: 150 })
  completedBookings!: number;

  @ApiProperty({ description: 'Cancelled bookings', example: 7 })
  cancelledBookings!: number;

  @ApiProperty({ description: 'Pending bookings (not yet completed)', example: 73 })
  pendingBookings!: number;

  @ApiProperty({ description: 'Completion rate percentage', example: 65.22 })
  completionRate!: number;

  @ApiProperty({ description: 'Cancellation rate percentage', example: 3.04 })
  cancellationRate!: number;

  @ApiProperty({ type: BookingStatusBreakdownDto, description: 'Breakdown by status' })
  statusBreakdown!: BookingStatusBreakdownDto;

  @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Bookings over time' })
  timeSeries!: TimeSeriesDataPointDto[];
}

export class RevenueBreakdownDto {
  @ApiProperty({ description: 'Total from base fares', example: 50000 })
  baseFare!: number;

  @ApiProperty({ description: 'Total from distance charges', example: 25000 })
  distanceCharge!: number;

  @ApiProperty({ description: 'Total from time charges', example: 5000 })
  timeCharge!: number;

  @ApiProperty({ description: 'Total from airport fees', example: 3000 })
  airportFees!: number;

  @ApiProperty({ description: 'Total from surcharges', example: 2000 })
  surcharges!: number;

  @ApiProperty({ description: 'Total from extras', example: 1500 })
  extras!: number;
}

export class RevenueReportDto {
  @ApiProperty({ description: 'Total revenue', example: 86500 })
  totalRevenue!: number;

  @ApiProperty({ description: 'Average booking value', example: 376.09 })
  averageBookingValue!: number;

  @ApiProperty({ description: 'Currency', example: 'MUR' })
  currency!: string;

  @ApiProperty({ description: 'Number of paid bookings', example: 230 })
  paidBookings!: number;

  @ApiProperty({ type: RevenueBreakdownDto, description: 'Revenue breakdown by category' })
  breakdown!: RevenueBreakdownDto;

  @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Revenue over time' })
  timeSeries!: TimeSeriesDataPointDto[];
}

export class DriverStatusBreakdownDto {
  @ApiProperty({ example: 15 })
  online!: number;

  @ApiProperty({ example: 10 })
  offline!: number;

  @ApiProperty({ example: 5 })
  busy!: number;

  @ApiProperty({ example: 2 })
  on_break!: number;
}

export class DriverAvailabilityBreakdownDto {
  @ApiProperty({ example: 12 })
  available!: number;

  @ApiProperty({ example: 8 })
  assigned!: number;

  @ApiProperty({ example: 5 })
  on_trip!: number;

  @ApiProperty({ example: 7 })
  unavailable!: number;
}

export class TopDriverDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  driverId!: string;

  @ApiProperty({ example: 'DRV-001' })
  driverCode!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 45 })
  completedTrips!: number;

  @ApiProperty({ example: 25000 })
  totalEarnings!: number;

  @ApiProperty({ example: 4.8 })
  rating!: number;
}

export class DriversReportDto {
  @ApiProperty({ description: 'Total number of drivers', example: 32 })
  totalDrivers!: number;

  @ApiProperty({ description: 'Active drivers (verified and isActive)', example: 25 })
  activeDrivers!: number;

  @ApiProperty({ description: 'Verified drivers', example: 28 })
  verifiedDrivers!: number;

  @ApiProperty({ description: 'Currently online drivers', example: 15 })
  onlineDrivers!: number;

  @ApiProperty({ description: 'Drivers on a trip', example: 5 })
  driversOnTrip!: number;

  @ApiProperty({ type: DriverStatusBreakdownDto, description: 'Breakdown by status' })
  statusBreakdown!: DriverStatusBreakdownDto;

  @ApiProperty({ type: DriverAvailabilityBreakdownDto, description: 'Breakdown by availability' })
  availabilityBreakdown!: DriverAvailabilityBreakdownDto;

  @ApiProperty({ type: [TopDriverDto], description: 'Top performing drivers' })
  topDrivers!: TopDriverDto[];

  @ApiProperty({ description: 'Total trips completed by all drivers', example: 500 })
  totalTripsCompleted!: number;

  @ApiProperty({ description: 'Total earnings by all drivers', example: 250000 })
  totalEarnings!: number;

  @ApiProperty({ description: 'Average driver rating', example: 4.5 })
  averageRating!: number;
}

export class OverviewSummaryDto {
  @ApiProperty({ example: 230 })
  totalBookings!: number;

  @ApiProperty({ example: 150 })
  completedBookings!: number;

  @ApiProperty({ example: 86500 })
  totalRevenue!: number;

  @ApiProperty({ example: 'MUR' })
  currency!: string;

  @ApiProperty({ example: 32 })
  totalDrivers!: number;

  @ApiProperty({ example: 15 })
  onlineDrivers!: number;

  @ApiProperty({ example: 65.22 })
  completionRate!: number;

  @ApiProperty({ example: 4.5 })
  averageDriverRating!: number;
}

export class OverviewReportDto {
  @ApiProperty({ type: OverviewSummaryDto, description: 'Summary statistics' })
  summary!: OverviewSummaryDto;

  @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Bookings over time' })
  bookingsTimeSeries!: TimeSeriesDataPointDto[];

  @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Revenue over time' })
  revenueTimeSeries!: TimeSeriesDataPointDto[];

  @ApiProperty({ type: BookingStatusBreakdownDto, description: 'Booking status breakdown' })
  bookingStatusBreakdown!: BookingStatusBreakdownDto;

  @ApiProperty({ type: [TopDriverDto], description: 'Top performing drivers' })
  topDrivers!: TopDriverDto[];
}

// Union type for different report responses
export class DashboardReportResponseDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  reportType!: ReportType;

  @ApiProperty({ description: 'Report unit (aggregation period)', enum: ReportUnit })
  unit!: ReportUnit;

  @ApiProperty({ description: 'Start date of the report period' })
  fromDate!: string;

  @ApiProperty({ description: 'End date of the report period' })
  toDate!: string;

  @ApiProperty({ description: 'When the report was generated' })
  generatedAt!: string;

  @ApiPropertyOptional({ type: OverviewReportDto, description: 'Overview report data (when report_type=overview)' })
  overview?: OverviewReportDto;

  @ApiPropertyOptional({ type: BookingsReportDto, description: 'Bookings report data (when report_type=bookings)' })
  bookings?: BookingsReportDto;

  @ApiPropertyOptional({ type: RevenueReportDto, description: 'Revenue report data (when report_type=revenue)' })
  revenue?: RevenueReportDto;

  @ApiPropertyOptional({ type: DriversReportDto, description: 'Drivers report data (when report_type=drivers)' })
  drivers?: DriversReportDto;
}

