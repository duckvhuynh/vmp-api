import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
import { AdminDriversService } from '../services/admin-drivers.service';
import {
  DriverQueryDto,
  CreateDriverDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
  UpdateDriverAvailabilityDto,
  ActivateDriverDto,
  VerifyDriverDto,
  UpdateDriverLocationAdminDto,
  UpdateDriverVehicleDto,
  DriverListResponseDto,
  DriverDetailResponseDto,
  DriverStatsOverviewDto,
  NearbyDriverDto,
  NearbyDriversQueryDto,
} from '../dto/admin-driver.dto';

@ApiTags('Admin - Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/drivers')
export class AdminDriversController {
  constructor(private readonly adminDriversService: AdminDriversService) {}

  // ============ LIST & SEARCH ============

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'List all drivers',
    description: 'Get a paginated list of all drivers with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers list retrieved successfully',
    type: DriverListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  async findAll(@Query() query: DriverQueryDto): Promise<DriverListResponseDto> {
    return this.adminDriversService.findAll(query);
  }

  @Get('stats')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get driver statistics',
    description: 'Get overview statistics for all drivers',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: DriverStatsOverviewDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  async getStats(): Promise<DriverStatsOverviewDto> {
    return this.adminDriversService.getStats();
  }

  @Get('nearby')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Find nearby available drivers',
    description: 'Find available drivers near a specific location',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby drivers retrieved successfully',
    type: [NearbyDriverDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  async findNearby(@Query() query: NearbyDriversQueryDto): Promise<NearbyDriverDto[]> {
    return this.adminDriversService.findNearbyDrivers(query);
  }

  // ============ CRUD OPERATIONS ============

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get driver details',
    description: 'Get detailed information about a specific driver',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver details retrieved successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findOne(@Param('id') id: string): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Create a new driver',
    description: 'Create a new driver account with vehicle information',
  })
  @ApiResponse({
    status: 201,
    description: 'Driver created successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Email or license plate already exists' })
  async create(@Body() dto: CreateDriverDto): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update driver',
    description: 'Update driver information',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Email or license plate already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate driver',
    description: 'Soft delete a driver by deactivating their account',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({ status: 204, description: 'Driver deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Driver has active bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminDriversService.delete(id);
  }

  @Delete(':id/permanent')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete driver',
    description: 'Permanently delete a driver (only if no booking history)',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({ status: 204, description: 'Driver permanently deleted' })
  @ApiResponse({ status: 400, description: 'Bad request - Driver has booking history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async permanentDelete(@Param('id') id: string): Promise<void> {
    return this.adminDriversService.permanentDelete(id);
  }

  // ============ STATUS MANAGEMENT ============

  @Patch(':id/status')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Update driver status',
    description: 'Update driver online/offline/busy status',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver status updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDriverStatusDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.updateStatus(id, dto.status, dto.reason);
  }

  @Patch(':id/availability')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Update driver availability',
    description: 'Update driver availability status',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver availability updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid availability change' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateDriverAvailabilityDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.updateAvailability(id, dto.availability, dto.reason);
  }

  @Patch(':id/activate')
  @Roles('admin')
  @ApiOperation({
    summary: 'Activate or deactivate driver',
    description: 'Enable or disable a driver account',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver activation status updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot deactivate driver with active bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async setActive(
    @Param('id') id: string,
    @Body() dto: ActivateDriverDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.setActive(id, dto.isActive, dto.reason);
  }

  @Patch(':id/verify')
  @Roles('admin')
  @ApiOperation({
    summary: 'Verify or unverify driver',
    description: 'Set driver verification status',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver verification status updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async setVerified(
    @Param('id') id: string,
    @Body() dto: VerifyDriverDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.setVerified(id, dto.isVerified, dto.notes);
  }

  // ============ LOCATION & VEHICLE ============

  @Patch(':id/location')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Update driver location',
    description: 'Manually update driver location (admin override)',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver location updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateDriverLocationAdminDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.updateLocation(
      id,
      dto.latitude,
      dto.longitude,
      dto.address,
    );
  }

  @Patch(':id/vehicle')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update driver vehicle',
    description: 'Update driver vehicle information',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiResponse({
    status: 200,
    description: 'Driver vehicle updated successfully',
    type: DriverDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 409, description: 'Conflict - License plate already exists' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateDriverVehicleDto,
  ): Promise<DriverDetailResponseDto> {
    return this.adminDriversService.updateVehicle(id, dto);
  }

  // ============ BOOKING HISTORY ============

  @Get(':id/bookings')
  @Roles('admin', 'dispatcher')
  @ApiOperation({
    summary: 'Get driver booking history',
    description: 'Get paginated booking history for a driver',
  })
  @ApiParam({ name: 'id', description: 'Driver ID (MongoDB _id or driverId)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Driver booking history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Dispatcher role required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async getBookings(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminDriversService.getDriverBookings(id, page || 1, limit || 10);
  }
}

