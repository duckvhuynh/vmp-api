import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { FixedPriceService } from '../services/fixed-price.service';
import { CreateFixedPriceDto, UpdateFixedPriceDto, FixedPriceResponseDto, FixedPriceListResponseDto } from '../dto/fixed-price.dto';
import { FixedPriceQueryDto } from '../dto/common.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Roles } from '../../../common/roles.decorator';

@ApiTags('Fixed Prices')
@Controller('fixed-prices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FixedPriceController {
  constructor(private readonly fixedPriceService: FixedPriceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Create a new fixed price route' })
  @ApiResponse({
    status: 201,
    description: 'Fixed price created successfully',
    type: FixedPriceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or duplicate route configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createFixedPriceDto: CreateFixedPriceDto): Promise<FixedPriceResponseDto> {
    return this.fixedPriceService.create(createFixedPriceDto);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get all fixed prices with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Fixed prices retrieved successfully',
    type: FixedPriceListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'originRegionId', required: false, description: 'Filter by origin region ID' })
  @ApiQuery({ name: 'destinationRegionId', required: false, description: 'Filter by destination region ID' })
  @ApiQuery({ name: 'vehicleClass', required: false, description: 'Filter by vehicle class' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  async findAll(@Query() query: FixedPriceQueryDto): Promise<FixedPriceListResponseDto> {
    return this.fixedPriceService.findAll(query);
  }

  @Get('by-route')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Get fixed price for specific route and vehicle class' })
  @ApiResponse({
    status: 200,
    description: 'Fixed price found',
    type: FixedPriceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fixed price not found' })
  @ApiQuery({ name: 'originRegionId', required: true, description: 'Origin region ID' })
  @ApiQuery({ name: 'destinationRegionId', required: true, description: 'Destination region ID' })
  @ApiQuery({ name: 'vehicleClass', required: true, description: 'Vehicle class' })
  async findByRoute(
    @Query('originRegionId') originRegionId: string,
    @Query('destinationRegionId') destinationRegionId: string,
    @Query('vehicleClass') vehicleClass: string,
  ): Promise<FixedPriceResponseDto | null> {
    return this.fixedPriceService.findByRoute(originRegionId, destinationRegionId, vehicleClass);
  }

  @Get('by-regions')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Get all fixed prices for a specific route (all vehicle classes)' })
  @ApiResponse({
    status: 200,
    description: 'Fixed prices found',
    type: [FixedPriceResponseDto],
  })
  @ApiQuery({ name: 'originRegionId', required: true, description: 'Origin region ID' })
  @ApiQuery({ name: 'destinationRegionId', required: true, description: 'Destination region ID' })
  async findByRegions(
    @Query('originRegionId') originRegionId: string,
    @Query('destinationRegionId') destinationRegionId: string,
  ): Promise<FixedPriceResponseDto[]> {
    return this.fixedPriceService.findByRegions(originRegionId, destinationRegionId);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get a fixed price by ID' })
  @ApiParam({ name: 'id', description: 'Fixed price ID' })
  @ApiResponse({
    status: 200,
    description: 'Fixed price retrieved successfully',
    type: FixedPriceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fixed price not found' })
  async findOne(@Param('id') id: string): Promise<FixedPriceResponseDto> {
    return this.fixedPriceService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Update a fixed price' })
  @ApiParam({ name: 'id', description: 'Fixed price ID' })
  @ApiResponse({
    status: 200,
    description: 'Fixed price updated successfully',
    type: FixedPriceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or duplicate route configuration' })
  @ApiResponse({ status: 404, description: 'Fixed price not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFixedPriceDto: UpdateFixedPriceDto,
  ): Promise<FixedPriceResponseDto> {
    return this.fixedPriceService.update(id, updateFixedPriceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a fixed price' })
  @ApiParam({ name: 'id', description: 'Fixed price ID' })
  @ApiResponse({ status: 204, description: 'Fixed price deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fixed price not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.fixedPriceService.remove(id);
  }
}
