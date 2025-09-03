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
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { VehiclesService } from './services/vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehicleResponseDto, VehicleListResponseDto } from './dto/vehicle-response.dto';

@ApiTags('Vehicle Management')
@Controller('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Create a new vehicle',
    description: `Create a new vehicle in the fleet management system with comprehensive details including:
    - Multi-language name and equivalent fields (English, Chinese, Vietnamese)
    - Vehicle classification (type and category)
    - Capacity specifications (passengers, luggage, weight)
    - Optional details (brand, model, features, etc.)
    
    **Note**: Only administrators can create new vehicles. License plate must be unique if provided.`
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle created successfully with all details',
    type: VehicleResponseDto,
    example: {
      _id: '60d5ecb54b8b1c001f5e3f5a',
      name: {
        translations: { en: 'Standard Sedan', cn: '标准轿车', vi: 'Xe sedan tiêu chuẩn' },
        value: 'Standard Sedan',
        defaultLanguage: 'en'
      },
      vehicleType: 'sedan',
      category: 'standard',
      capacity: { maxPassengers: 4, maxLuggage: 2, maxWeight: 400 },
      isElectric: false,
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data, validation errors, or vehicle with license plate already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Vehicle with this license plate already exists' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication token is missing or invalid',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin privileges required for this operation',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' },
        statusCode: { type: 'number', example: 403 }
      }
    }
  })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @Roles('admin', 'dispatcher')
  @ApiOperation({ 
    summary: 'Get vehicles with advanced filtering and pagination',
    description: `Retrieve a paginated list of vehicles with comprehensive filtering options:
    
    **Filtering Options:**
    - Search by name, description, brand, model, or license plate
    - Filter by vehicle type (sedan, suv, van, etc.)
    - Filter by category (economy, standard, premium, etc.)
    - Filter by electric status or active status
    - Filter by passenger capacity range
    
    **Pagination & Sorting:**
    - Configurable page size (1-100 items)
    - Sort by multiple fields with ascending/descending order
    - Total count and page information included
    
    **Multi-language Support:**
    - Specify preferred language for translation fields
    - Fallback to default language when translation unavailable`
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles retrieved successfully with pagination information',
    type: VehicleListResponseDto,
    example: {
      vehicles: [
        {
          _id: '60d5ecb54b8b1c001f5e3f5a',
          name: {
            translations: { en: 'Standard Sedan', cn: '标准轿车', vi: 'Xe sedan tiêu chuẩn' },
            value: 'Standard Sedan',
            defaultLanguage: 'en'
          },
          vehicleType: 'sedan',
          category: 'standard',
          isActive: true
        }
      ],
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication token is missing or invalid',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin or dispatcher privileges',
  })
  async findAll(@Query() query: VehicleQueryDto): Promise<VehicleListResponseDto> {
    return this.vehiclesService.findAll(query);
  }

  @Get('available')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ 
    summary: 'Get all available vehicles',
    description: 'Retrieve all active vehicles'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available vehicles retrieved successfully',
    type: [VehicleResponseDto],
  })
  async findAvailable(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findAvailable();
  }

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get comprehensive vehicle fleet statistics',
    description: `Retrieve detailed analytics and statistics about the vehicle fleet including:
    
    **Fleet Overview:**
    - Total vehicle count (all vehicles)
    - Active vs inactive vehicle counts
    - Electric vs conventional vehicle distribution
    
    **Distribution Analytics:**
    - Vehicle count by type (sedan, suv, van, etc.)
    - Vehicle count by category (economy, standard, premium, etc.)
    - Sorted by popularity/usage
    
    **Use Cases:**
    - Fleet management dashboard
    - Business intelligence reporting
    - Capacity planning and fleet optimization`
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalVehicles: { type: 'number', example: 50, description: 'Total number of vehicles in fleet' },
        activeVehicles: { type: 'number', example: 45, description: 'Number of currently active vehicles' },
        inactiveVehicles: { type: 'number', example: 5, description: 'Number of inactive/deactivated vehicles' },
        electricVehicles: { type: 'number', example: 12, description: 'Number of electric vehicles' },
        conventionalVehicles: { type: 'number', example: 38, description: 'Number of conventional fuel vehicles' },
        typeDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'sedan' },
              count: { type: 'number', example: 20 }
            }
          },
          description: 'Vehicle count grouped by type'
        },
        categoryDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'standard' },
              count: { type: 'number', example: 25 }
            }
          },
          description: 'Vehicle count grouped by category'
        }
      }
    }
  })
  async getStatistics(): Promise<any> {
    return this.vehiclesService.getStatistics();
  }

  @Get('type/:vehicleType')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ 
    summary: 'Get vehicles by type',
    description: 'Retrieve all active vehicles of a specific type'
  })
  @ApiParam({
    name: 'vehicleType',
    description: 'Type of vehicle',
    enum: ['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles retrieved successfully',
    type: [VehicleResponseDto],
  })
  async findByType(@Param('vehicleType') vehicleType: string): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findByType(vehicleType);
  }

  @Get('category/:category')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ 
    summary: 'Get vehicles by category',
    description: 'Retrieve all active vehicles of a specific category'
  })
  @ApiParam({
    name: 'category',
    description: 'Category of vehicle',
    enum: ['economy', 'standard', 'premium', 'luxury', 'business'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles retrieved successfully',
    type: [VehicleResponseDto],
  })
  async findByCategory(@Param('category') category: string): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findByCategory(category);
  }

  @Get('suitable/:passengerCount')
  @Roles('admin', 'dispatcher', 'driver')
  @ApiOperation({ 
    summary: 'Find vehicles suitable for passenger count',
    description: 'Find vehicles that can accommodate the specified number of passengers'
  })
  @ApiParam({
    name: 'passengerCount',
    description: 'Number of passengers',
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suitable vehicles retrieved successfully',
    type: [VehicleResponseDto],
  })
  async findSuitableForPassengers(
    @Param('passengerCount', ParseIntPipe) passengerCount: number
  ): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findSuitableForPassengers(passengerCount);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  @ApiOperation({ 
    summary: 'Get vehicle by ID',
    description: 'Retrieve a specific vehicle by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle retrieved successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async findOne(@Param('id') id: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update vehicle by ID',
    description: 'Update a specific vehicle by its ID. Admin access required.'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or license plate already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Deactivate vehicle by ID',
    description: 'Soft delete (deactivate) a vehicle by setting isActive to false. Admin access required.'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been deactivated successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.vehiclesService.remove(id);
  }

  @Delete(':id/hard')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Permanently delete vehicle by ID',
    description: 'Hard delete a vehicle permanently from the database. Admin access required.'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle permanently deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been permanently deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async hardRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.vehiclesService.hardRemove(id);
  }

  @Patch(':id/restore')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Restore deactivated vehicle',
    description: 'Restore a deactivated vehicle by setting isActive to true. Admin access required.'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle restored successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async restore(@Param('id') id: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.restore(id);
  }
}
