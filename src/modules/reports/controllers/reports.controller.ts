import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../../common/roles.guard';
import { Roles } from '../../../common/roles.decorator';
import { ReportsService } from '../services/reports.service';
import {
  DashboardReportQueryDto,
  DashboardReportResponseDto,
  ReportType,
  ReportUnit,
} from '../dto/report.dto';

@ApiTags('Admin - Reports')
@Controller('admin/report')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get dashboard report data',
    description: `
      Generate comprehensive report data for the admin dashboard.
      
      **Report Types:**
      - \`overview\` - Combined summary with bookings, revenue, and driver stats
      - \`bookings\` - Detailed booking statistics and time series
      - \`revenue\` - Revenue breakdown and trends
      - \`drivers\` - Driver performance and status metrics
      
      **Time Units:**
      - \`day\` - Data aggregated by day
      - \`week\` - Data aggregated by week (ISO weeks)
      - \`month\` - Data aggregated by month
      
      **Use Cases:**
      - Dashboard charts and KPIs
      - Performance analytics
      - Business intelligence reporting
      - Trend analysis
    `,
  })
  @ApiQuery({
    name: 'unit',
    enum: ReportUnit,
    description: 'Time unit for aggregation (day, week, month)',
    required: true,
  })
  @ApiQuery({
    name: 'report_type',
    enum: ReportType,
    description: 'Type of report to generate',
    required: true,
  })
  @ApiQuery({
    name: 'from_date',
    description: 'Start date (ISO 8601 format)',
    required: true,
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'to_date',
    description: 'End date (ISO 8601 format)',
    required: true,
    example: '2025-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report data retrieved successfully',
    type: DashboardReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin/Dispatcher access required',
  })
  async getDashboardReport(
    @Query() query: DashboardReportQueryDto,
  ): Promise<DashboardReportResponseDto> {
    return this.reportsService.getDashboardReport(query);
  }
}

