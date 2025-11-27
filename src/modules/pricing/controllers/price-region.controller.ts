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
import { PriceRegionService } from '../services/price-region.service';
import { CreatePriceRegionDto, UpdatePriceRegionDto, PriceRegionResponseDto, PriceRegionListResponseDto } from '../dto/price-region.dto';
import { PriceRegionQueryDto } from '../dto/common.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Roles } from '../../../common/roles.decorator';
import { RolesGuard } from '../../../common/roles.guard';

@ApiTags('Price Regions')
@Controller('price-regions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PriceRegionController {
  constructor(private readonly priceRegionService: PriceRegionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Create a new price region' })
  @ApiResponse({
    status: 201,
    description: 'Price region created successfully',
    type: PriceRegionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createPriceRegionDto: CreatePriceRegionDto): Promise<PriceRegionResponseDto> {
    return this.priceRegionService.create(createPriceRegionDto);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get all price regions with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Price regions retrieved successfully',
    type: PriceRegionListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  async findAll(@Query() query: PriceRegionQueryDto): Promise<PriceRegionListResponseDto> {
    return this.priceRegionService.findAll(query);
  }

  @Get('by-location')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Find price regions containing a specific location' })
  @ApiResponse({
    status: 200,
    description: 'Price regions found for location',
    type: [PriceRegionResponseDto],
  })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude coordinate', example: 55.2708 })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude coordinate', example: 25.2048 })
  async findByLocation(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
  ): Promise<PriceRegionResponseDto[]> {
    return this.priceRegionService.findByLocation(longitude, latitude);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get a price region by ID' })
  @ApiParam({ name: 'id', description: 'Price region ID' })
  @ApiResponse({
    status: 200,
    description: 'Price region retrieved successfully',
    type: PriceRegionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Price region not found' })
  async findOne(@Param('id') id: string): Promise<PriceRegionResponseDto> {
    return this.priceRegionService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Update a price region' })
  @ApiParam({ name: 'id', description: 'Price region ID' })
  @ApiResponse({
    status: 200,
    description: 'Price region updated successfully',
    type: PriceRegionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Price region not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePriceRegionDto: UpdatePriceRegionDto,
  ): Promise<PriceRegionResponseDto> {
    return this.priceRegionService.update(id, updatePriceRegionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a price region' })
  @ApiParam({ name: 'id', description: 'Price region ID' })
  @ApiResponse({ status: 204, description: 'Price region deleted successfully' })
  @ApiResponse({ status: 404, description: 'Price region not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.priceRegionService.remove(id);
  }
}
