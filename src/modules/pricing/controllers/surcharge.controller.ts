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
import { SurchargeService } from '../services/surcharge.service';
import { CreateSurchargeDto, UpdateSurchargeDto, SurchargeResponseDto, SurchargeListResponseDto } from '../dto/surcharge.dto';
import { SurchargeQueryDto } from '../dto/common.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Roles } from '../../../common/roles.decorator';

@ApiTags('Surcharges')
@Controller('surcharges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SurchargeController {
  constructor(private readonly surchargeService: SurchargeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Create a new surcharge rule' })
  @ApiResponse({
    status: 201,
    description: 'Surcharge created successfully',
    type: SurchargeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createSurchargeDto: CreateSurchargeDto): Promise<SurchargeResponseDto> {
    return this.surchargeService.create(createSurchargeDto);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get all surcharges with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Surcharges retrieved successfully',
    type: SurchargeListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'regionId', required: false, description: 'Filter by region ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by surcharge type' })
  async findAll(@Query() query: SurchargeQueryDto): Promise<SurchargeListResponseDto> {
    return this.surchargeService.findAll(query);
  }

  @Get('applicable')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ summary: 'Find applicable surcharges for a booking scenario' })
  @ApiResponse({
    status: 200,
    description: 'Applicable surcharges found',
    type: [SurchargeResponseDto],
  })
  @ApiQuery({ name: 'regionId', required: true, description: 'Region ID' })
  @ApiQuery({ name: 'bookingDateTime', required: true, description: 'Booking date and time (ISO string)' })
  @ApiQuery({ name: 'minutesUntilPickup', required: false, description: 'Minutes until pickup time' })
  async findApplicableSurcharges(
    @Query('regionId') regionId: string,
    @Query('bookingDateTime') bookingDateTime: string,
    @Query('minutesUntilPickup') minutesUntilPickup?: string,
  ): Promise<SurchargeResponseDto[]> {
    const bookingDate = new Date(bookingDateTime);
    const minutesUntil = minutesUntilPickup ? parseInt(minutesUntilPickup) : undefined;
    
    return this.surchargeService.findApplicableSurcharges(regionId, bookingDate, minutesUntil);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Get a surcharge by ID' })
  @ApiParam({ name: 'id', description: 'Surcharge ID' })
  @ApiResponse({
    status: 200,
    description: 'Surcharge retrieved successfully',
    type: SurchargeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Surcharge not found' })
  async findOne(@Param('id') id: string): Promise<SurchargeResponseDto> {
    return this.surchargeService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ summary: 'Update a surcharge' })
  @ApiParam({ name: 'id', description: 'Surcharge ID' })
  @ApiResponse({
    status: 200,
    description: 'Surcharge updated successfully',
    type: SurchargeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Surcharge not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSurchargeDto: UpdateSurchargeDto,
  ): Promise<SurchargeResponseDto> {
    return this.surchargeService.update(id, updateSurchargeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a surcharge' })
  @ApiParam({ name: 'id', description: 'Surcharge ID' })
  @ApiResponse({ status: 204, description: 'Surcharge deleted successfully' })
  @ApiResponse({ status: 404, description: 'Surcharge not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.surchargeService.remove(id);
  }
}
