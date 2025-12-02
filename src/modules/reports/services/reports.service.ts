import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DashboardReportQueryDto,
  DashboardReportResponseDto,
  ReportType,
  ReportUnit,
  BookingsReportDto,
  RevenueReportDto,
  DriversReportDto,
  OverviewReportDto,
  TimeSeriesDataPointDto,
  BookingStatusBreakdownDto,
  TopDriverDto,
  DriverStatusBreakdownDto,
  DriverAvailabilityBreakdownDto,
  RevenueBreakdownDto,
  OverviewSummaryDto,
} from '../dto/report.dto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus } from '../../bookings/schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverDocument, DriverStatus, DriverAvailability } from '../../drivers/schemas/simple-driver.schema';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(SimpleBooking.name) private readonly bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(SimpleDriver.name) private readonly driverModel: Model<SimpleDriverDocument>,
  ) {}

  async getDashboardReport(query: DashboardReportQueryDto): Promise<DashboardReportResponseDto> {
    const { unit, report_type, from_date, to_date } = query;
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    this.logger.log(`Generating ${report_type} report from ${fromDate} to ${toDate} with unit ${unit}`);

    const response: DashboardReportResponseDto = {
      reportType: report_type,
      unit,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    switch (report_type) {
      case ReportType.OVERVIEW:
        response.overview = await this.generateOverviewReport(fromDate, toDate, unit);
        break;
      case ReportType.BOOKINGS:
        response.bookings = await this.generateBookingsReport(fromDate, toDate, unit);
        break;
      case ReportType.REVENUE:
        response.revenue = await this.generateRevenueReport(fromDate, toDate, unit);
        break;
      case ReportType.DRIVERS:
        response.drivers = await this.generateDriversReport(fromDate, toDate);
        break;
    }

    return response;
  }

  // ===== Overview Report =====
  private async generateOverviewReport(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): Promise<OverviewReportDto> {
    // Get booking stats
    const bookingsReport = await this.generateBookingsReport(fromDate, toDate, unit);
    const revenueReport = await this.generateRevenueReport(fromDate, toDate, unit);
    const driversReport = await this.generateDriversReport(fromDate, toDate);

    const summary: OverviewSummaryDto = {
      totalBookings: bookingsReport.totalBookings,
      completedBookings: bookingsReport.completedBookings,
      totalRevenue: revenueReport.totalRevenue,
      currency: revenueReport.currency,
      totalDrivers: driversReport.totalDrivers,
      onlineDrivers: driversReport.onlineDrivers,
      completionRate: bookingsReport.completionRate,
      averageDriverRating: driversReport.averageRating,
    };

    return {
      summary,
      bookingsTimeSeries: bookingsReport.timeSeries,
      revenueTimeSeries: revenueReport.timeSeries,
      bookingStatusBreakdown: bookingsReport.statusBreakdown,
      topDrivers: driversReport.topDrivers,
    };
  }

  // ===== Bookings Report =====
  private async generateBookingsReport(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): Promise<BookingsReportDto> {
    // Get all bookings in the date range
    const bookings = await this.bookingModel.find({
      createdAt: { $gte: fromDate, $lte: toDate },
    }).exec();

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    const cancelledBookings = bookings.filter(b =>
      [BookingStatus.CANCELLED_BY_USER, BookingStatus.CANCELLED_BY_OPS].includes(b.status)
    ).length;
    const pendingBookings = bookings.filter(b =>
      ![BookingStatus.COMPLETED, BookingStatus.CANCELLED_BY_USER, BookingStatus.CANCELLED_BY_OPS].includes(b.status)
    ).length;

    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Status breakdown
    const statusBreakdown = await this.getBookingStatusBreakdown(fromDate, toDate);

    // Time series
    const timeSeries = await this.getBookingsTimeSeries(fromDate, toDate, unit);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      statusBreakdown,
      timeSeries,
    };
  }

  private async getBookingStatusBreakdown(fromDate: Date, toDate: Date): Promise<BookingStatusBreakdownDto> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await this.bookingModel.aggregate(pipeline).exec();

    const breakdown: BookingStatusBreakdownDto = {
      pending_payment: 0,
      confirmed: 0,
      driver_assigned: 0,
      en_route: 0,
      arrived: 0,
      waiting: 0,
      on_trip: 0,
      completed: 0,
      cancelled_by_user: 0,
      cancelled_by_ops: 0,
      payment_failed: 0,
      no_show: 0,
      driver_declined: 0,
    };

    results.forEach((r: { _id: string; count: number }) => {
      const key = r._id.replace(/-/g, '_') as keyof BookingStatusBreakdownDto;
      if (key in breakdown) {
        breakdown[key] = r.count;
      }
    });

    return breakdown;
  }

  private async getBookingsTimeSeries(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): Promise<TimeSeriesDataPointDto[]> {
    const groupBy = this.getMongoDateGroupFormat(unit);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          firstDate: { $min: '$createdAt' },
        },
      },
      {
        $sort: { '_id.year': 1 as 1 | -1, '_id.month': 1 as 1 | -1, '_id.day': 1 as 1 | -1, '_id.week': 1 as 1 | -1 },
      },
    ];

    const results = await this.bookingModel.aggregate(pipeline).exec();

    return this.formatTimeSeriesResults(results, unit, fromDate, toDate);
  }

  // ===== Revenue Report =====
  private async generateRevenueReport(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): Promise<RevenueReportDto> {
    // Get completed/confirmed bookings with payment for revenue calculation
    const paidBookings = await this.bookingModel.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED, BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.WAITING, BookingStatus.ON_TRIP] },
    }).exec();

    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.total || 0), 0);
    const averageBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;

    // Get primary currency (most common)
    const currencyCounts: Record<string, number> = {};
    paidBookings.forEach(b => {
      currencyCounts[b.currency] = (currencyCounts[b.currency] || 0) + 1;
    });
    const currency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MUR';

    // Revenue breakdown
    const breakdown = await this.getRevenueBreakdown(fromDate, toDate);

    // Time series
    const timeSeries = await this.getRevenueTimeSeries(fromDate, toDate, unit);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      currency,
      paidBookings: paidBookings.length,
      breakdown,
      timeSeries,
    };
  }

  private async getRevenueBreakdown(fromDate: Date, toDate: Date): Promise<RevenueBreakdownDto> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          status: { $in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED, BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.WAITING, BookingStatus.ON_TRIP] },
        },
      },
      {
        $group: {
          _id: null,
          baseFare: { $sum: { $ifNull: ['$baseFare', 0] } },
          distanceCharge: { $sum: { $ifNull: ['$distanceCharge', 0] } },
          timeCharge: { $sum: { $ifNull: ['$timeCharge', 0] } },
          airportFees: { $sum: { $ifNull: ['$airportFees', 0] } },
          surcharges: { $sum: { $ifNull: ['$surcharges', 0] } },
          extras: { $sum: { $ifNull: ['$extrasTotal', 0] } },
        },
      },
    ];

    const results = await this.bookingModel.aggregate(pipeline).exec();

    if (results.length === 0) {
      return {
        baseFare: 0,
        distanceCharge: 0,
        timeCharge: 0,
        airportFees: 0,
        surcharges: 0,
        extras: 0,
      };
    }

    const r = results[0];
    return {
      baseFare: Math.round((r.baseFare || 0) * 100) / 100,
      distanceCharge: Math.round((r.distanceCharge || 0) * 100) / 100,
      timeCharge: Math.round((r.timeCharge || 0) * 100) / 100,
      airportFees: Math.round((r.airportFees || 0) * 100) / 100,
      surcharges: Math.round((r.surcharges || 0) * 100) / 100,
      extras: Math.round((r.extras || 0) * 100) / 100,
    };
  }

  private async getRevenueTimeSeries(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): Promise<TimeSeriesDataPointDto[]> {
    const groupBy = this.getMongoDateGroupFormat(unit);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          status: { $in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED, BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.WAITING, BookingStatus.ON_TRIP] },
        },
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$total' },
          firstDate: { $min: '$createdAt' },
        },
      },
      {
        $sort: { '_id.year': 1 as 1 | -1, '_id.month': 1 as 1 | -1, '_id.day': 1 as 1 | -1, '_id.week': 1 as 1 | -1 },
      },
    ];

    const results = await this.bookingModel.aggregate(pipeline).exec();

    return this.formatTimeSeriesResults(results, unit, fromDate, toDate, 'total');
  }

  // ===== Drivers Report =====
  private async generateDriversReport(fromDate: Date, toDate: Date): Promise<DriversReportDto> {
    // Get all drivers
    const drivers = await this.driverModel.find().exec();

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.isActive && d.isVerified).length;
    const verifiedDrivers = drivers.filter(d => d.isVerified).length;
    const onlineDrivers = drivers.filter(d => d.status === DriverStatus.ONLINE).length;
    const driversOnTrip = drivers.filter(d => d.availability === DriverAvailability.ON_TRIP).length;

    // Status breakdown
    const statusBreakdown: DriverStatusBreakdownDto = {
      online: drivers.filter(d => d.status === DriverStatus.ONLINE).length,
      offline: drivers.filter(d => d.status === DriverStatus.OFFLINE).length,
      busy: drivers.filter(d => d.status === DriverStatus.BUSY).length,
      on_break: drivers.filter(d => d.status === DriverStatus.ON_BREAK).length,
    };

    // Availability breakdown
    const availabilityBreakdown: DriverAvailabilityBreakdownDto = {
      available: drivers.filter(d => d.availability === DriverAvailability.AVAILABLE).length,
      assigned: drivers.filter(d => d.availability === DriverAvailability.ASSIGNED).length,
      on_trip: drivers.filter(d => d.availability === DriverAvailability.ON_TRIP).length,
      unavailable: drivers.filter(d => d.availability === DriverAvailability.UNAVAILABLE).length,
    };

    // Top drivers by completed trips
    const topDrivers: TopDriverDto[] = drivers
      .filter(d => d.isActive && d.isVerified)
      .sort((a, b) => b.completedTrips - a.completedTrips)
      .slice(0, 10)
      .map(d => ({
        driverId: d._id.toString(),
        driverCode: d.driverId,
        name: `${d.firstName} ${d.lastName}`,
        completedTrips: d.completedTrips || 0,
        totalEarnings: d.totalEarnings || 0,
        rating: d.rating || 0,
      }));

    // Aggregate stats
    const totalTripsCompleted = drivers.reduce((sum, d) => sum + (d.completedTrips || 0), 0);
    const totalEarnings = drivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);
    const driversWithRatings = drivers.filter(d => d.rating > 0);
    const averageRating = driversWithRatings.length > 0
      ? driversWithRatings.reduce((sum, d) => sum + d.rating, 0) / driversWithRatings.length
      : 0;

    return {
      totalDrivers,
      activeDrivers,
      verifiedDrivers,
      onlineDrivers,
      driversOnTrip,
      statusBreakdown,
      availabilityBreakdown,
      topDrivers,
      totalTripsCompleted,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  }

  // ===== Helper Methods =====
  private getMongoDateGroupFormat(unit: ReportUnit): Record<string, any> {
    switch (unit) {
      case ReportUnit.DAY:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
      case ReportUnit.WEEK:
        return {
          year: { $isoWeekYear: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
        };
      case ReportUnit.MONTH:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
    }
  }

  private formatTimeSeriesResults(
    results: any[],
    unit: ReportUnit,
    fromDate: Date,
    toDate: Date,
    valueField: string = 'count',
  ): TimeSeriesDataPointDto[] {
    // Generate all periods in the date range
    const periods = this.generatePeriods(fromDate, toDate, unit);

    // Map results to periods
    const resultMap = new Map<string, number>();
    results.forEach(r => {
      const key = this.getPeriodKey(r._id, unit);
      resultMap.set(key, r[valueField] || 0);
    });

    // Fill in the time series
    return periods.map(period => {
      const key = this.getPeriodKey(period.id, unit);
      return {
        label: period.label,
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        value: Math.round((resultMap.get(key) || 0) * 100) / 100,
      };
    });
  }

  private getPeriodKey(id: any, unit: ReportUnit): string {
    switch (unit) {
      case ReportUnit.DAY:
        return `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
      case ReportUnit.WEEK:
        return `${id.year}-W${String(id.week).padStart(2, '0')}`;
      case ReportUnit.MONTH:
        return `${id.year}-${String(id.month).padStart(2, '0')}`;
    }
  }

  private generatePeriods(
    fromDate: Date,
    toDate: Date,
    unit: ReportUnit,
  ): { id: any; label: string; start: Date; end: Date }[] {
    const periods: { id: any; label: string; start: Date; end: Date }[] = [];
    let current = new Date(fromDate);

    while (current <= toDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let id: any;
      let label: string;

      switch (unit) {
        case ReportUnit.DAY:
          periodStart = new Date(current);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart);
          periodEnd.setHours(23, 59, 59, 999);
          id = {
            year: current.getFullYear(),
            month: current.getMonth() + 1,
            day: current.getDate(),
          };
          label = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 1);
          break;

        case ReportUnit.WEEK:
          // Get start of week (Monday)
          const dayOfWeek = current.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          periodStart = new Date(current);
          periodStart.setDate(current.getDate() + diff);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          const weekNum = this.getISOWeek(periodStart);
          id = {
            year: this.getISOWeekYear(periodStart),
            week: weekNum,
          };
          label = `${id.year}-W${String(weekNum).padStart(2, '0')}`;
          current = new Date(periodEnd);
          current.setDate(current.getDate() + 1);
          break;

        case ReportUnit.MONTH:
          periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
          id = {
            year: current.getFullYear(),
            month: current.getMonth() + 1,
          };
          label = `${id.year}-${String(id.month).padStart(2, '0')}`;
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          break;
      }

      // Only add if period is within range
      if (periodStart! <= toDate && periodEnd! >= fromDate) {
        periods.push({ id, label, start: periodStart!, end: periodEnd! });
      }
    }

    return periods;
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getISOWeekYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
  }
}

