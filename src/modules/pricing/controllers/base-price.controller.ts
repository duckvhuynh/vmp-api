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
import { BasePriceService } from '../services/base-price.service';
import { CreateBasePriceDto, UpdateBasePriceDto, BasePriceResponseDto, BasePriceListResponseDto } from '../dto/base-price.dto';
import { BasePriceQueryDto } from '../dto/common.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Roles } from '../../../common/roles.decorator';
import { RolesGuard } from '../../../common/roles.guard';

@ApiTags('Base Prices')
@Controller('base-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BasePriceController {
  constructor(private readonly basePriceService: BasePriceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Create a new base price configuration' })
  @ApiResponse({
    status: 201,
    description: 'Base price created successfully',
    type: BasePriceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or duplicate configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createBasePriceDto: CreateBasePriceDto): Promise<BasePriceResponseDto> {
    return this.basePriceService.create(createBasePriceDto);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get all base prices with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Base prices retrieved successfully',
    type: BasePriceListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'regionId', required: false, description: 'Filter by region ID' })
  @ApiQuery({ name: 'vehicleClass', required: false, description: 'Filter by vehicle class' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  async findAll(@Query() query: BasePriceQueryDto): Promise<BasePriceListResponseDto> {
    return this.basePriceService.findAll(query);
  }

  @Get('by-region-vehicle')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Get base price for specific region and vehicle class' })
  @ApiResponse({
    status: 200,
    description: 'Base price found',
    type: BasePriceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Base price not found' })
  @ApiQuery({ name: 'regionId', required: true, description: 'Region ID' })
  @ApiQuery({ name: 'vehicleClass', required: true, description: 'Vehicle class' })
  async findByRegionAndVehicleClass(
    @Query('regionId') regionId: string,
    @Query('vehicleClass') vehicleClass: string,
  ): Promise<BasePriceResponseDto | null> {
    return this.basePriceService.findByRegionAndVehicleClass(regionId, vehicleClass);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get a base price by ID' })
  @ApiParam({ name: 'id', description: 'Base price ID' })
  @ApiResponse({
    status: 200,
    description: 'Base price retrieved successfully',
    type: BasePriceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Base price not found' })
  async findOne(@Param('id') id: string): Promise<BasePriceResponseDto> {
    return this.basePriceService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Update a base price' })
  @ApiParam({ name: 'id', description: 'Base price ID' })
  @ApiResponse({
    status: 200,
    description: 'Base price updated successfully',
    type: BasePriceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or duplicate configuration' })
  @ApiResponse({ status: 404, description: 'Base price not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBasePriceDto: UpdateBasePriceDto,
  ): Promise<BasePriceResponseDto> {
    return this.basePriceService.update(id, updateBasePriceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a base price' })
  @ApiParam({ name: 'id', description: 'Base price ID' })
  @ApiResponse({ status: 204, description: 'Base price deleted successfully' })
  @ApiResponse({ status: 404, description: 'Base price not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.basePriceService.remove(id);
  }
}
