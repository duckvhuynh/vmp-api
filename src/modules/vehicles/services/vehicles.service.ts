import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleQueryDto } from '../dto/vehicle-query.dto';
import { VehicleResponseDto, VehicleListResponseDto } from '../dto/vehicle-response.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  /**
   * Create a new vehicle
   */
  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    try {
      // Check if vehicle with same license plate exists (if provided)
      if (createVehicleDto.licensePlate) {
        const existingVehicle = await this.vehicleModel.findOne({
          licensePlate: createVehicleDto.licensePlate,
        });
        if (existingVehicle) {
          throw new BadRequestException('Vehicle with this license plate already exists');
        }
      }

      const createdVehicle = new this.vehicleModel(createVehicleDto);
      const savedVehicle = await createdVehicle.save();
      return this.formatVehicleResponse(savedVehicle);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Find all vehicles with filtering, pagination, and search
   */
  async findAll(query: VehicleQueryDto): Promise<VehicleListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      vehicleType,
      category,
      isElectric,
      isActive,
      minPassengers,
      maxPassengers,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { 'name.value': { $regex: search, $options: 'i' } },
        { 'name.translations.en': { $regex: search, $options: 'i' } },
        { 'name.translations.cn': { $regex: search, $options: 'i' } },
        { 'name.translations.vi': { $regex: search, $options: 'i' } },
        { 'equivalent.value': { $regex: search, $options: 'i' } },
        { 'equivalent.translations.en': { $regex: search, $options: 'i' } },
        { 'equivalent.translations.cn': { $regex: search, $options: 'i' } },
        { 'equivalent.translations.vi': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
      ];
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (category) {
      filter.category = category;
    }

    if (typeof isElectric === 'boolean') {
      filter.isElectric = isElectric;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (minPassengers || maxPassengers) {
      filter['capacity.maxPassengers'] = {};
      if (minPassengers) {
        filter['capacity.maxPassengers'].$gte = minPassengers;
      }
      if (maxPassengers) {
        filter['capacity.maxPassengers'].$lte = maxPassengers;
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      // Execute queries
      const [vehicles, total] = await Promise.all([
        this.vehicleModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.vehicleModel.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        vehicles: vehicles.map(vehicle => this.formatVehicleResponse(vehicle)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve vehicles: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Find vehicle by ID
   */
  async findOne(id: string): Promise<VehicleResponseDto> {
    try {
      const vehicle = await this.vehicleModel.findById(id).exec();
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }
      return this.formatVehicleResponse(vehicle);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Update vehicle by ID
   */
  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    try {
      // Check if vehicle exists
      const existingVehicle = await this.vehicleModel.findById(id).exec();
      if (!existingVehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      // Check license plate uniqueness (if provided and different from current)
      if (updateVehicleDto.licensePlate && 
          updateVehicleDto.licensePlate !== existingVehicle.licensePlate) {
        const duplicateVehicle = await this.vehicleModel.findOne({
          licensePlate: updateVehicleDto.licensePlate,
          _id: { $ne: id },
        });
        if (duplicateVehicle) {
          throw new BadRequestException('Vehicle with this license plate already exists');
        }
      }

      const updatedVehicle = await this.vehicleModel
        .findByIdAndUpdate(id, updateVehicleDto, { new: true, runValidators: true })
        .exec();

      if (!updatedVehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      return this.formatVehicleResponse(updatedVehicle);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete vehicle by ID (soft delete by setting isActive to false)
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const updatedVehicle = await this.vehicleModel
        .findByIdAndUpdate(id, { isActive: false }, { new: true })
        .exec();

      if (!updatedVehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      return { message: `Vehicle with ID ${id} has been deactivated successfully` };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to deactivate vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Hard delete vehicle by ID
   */
  async hardRemove(id: string): Promise<{ message: string }> {
    try {
      const deletedVehicle = await this.vehicleModel.findByIdAndDelete(id).exec();

      if (!deletedVehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      return { message: `Vehicle with ID ${id} has been permanently deleted` };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Restore deactivated vehicle
   */
  async restore(id: string): Promise<VehicleResponseDto> {
    try {
      const updatedVehicle = await this.vehicleModel
        .findByIdAndUpdate(id, { isActive: true }, { new: true })
        .exec();

      if (!updatedVehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      return this.formatVehicleResponse(updatedVehicle);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to restore vehicle: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get vehicles by type
   */
  async findByType(vehicleType: string): Promise<VehicleResponseDto[]> {
    try {
      const vehicles = await this.vehicleModel
        .find({ vehicleType, isActive: true })
        .sort({ 'name.value': 1 })
        .exec();

      return vehicles.map(vehicle => this.formatVehicleResponse(vehicle));
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve vehicles by type: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get vehicles by category
   */
  async findByCategory(category: string): Promise<VehicleResponseDto[]> {
    try {
      const vehicles = await this.vehicleModel
        .find({ category, isActive: true })
        .sort({ 'name.value': 1 })
        .exec();

      return vehicles.map(vehicle => this.formatVehicleResponse(vehicle));
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve vehicles by category: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get available vehicles (active vehicles)
   */
  async findAvailable(): Promise<VehicleResponseDto[]> {
    try {
      const vehicles = await this.vehicleModel
        .find({ isActive: true })
        .sort({ category: 1, 'capacity.maxPassengers': 1 })
        .exec();

      return vehicles.map(vehicle => this.formatVehicleResponse(vehicle));
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve available vehicles: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get vehicle statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [
        totalVehicles,
        activeVehicles,
        electricVehicles,
        typeStats,
        categoryStats,
      ] = await Promise.all([
        this.vehicleModel.countDocuments({}),
        this.vehicleModel.countDocuments({ isActive: true }),
        this.vehicleModel.countDocuments({ isElectric: true }),
        this.vehicleModel.aggregate([
          { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        this.vehicleModel.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles: totalVehicles - activeVehicles,
        electricVehicles,
        conventionalVehicles: totalVehicles - electricVehicles,
        typeDistribution: typeStats,
        categoryDistribution: categoryStats,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to retrieve vehicle statistics: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Find vehicles suitable for passenger count
   */
  async findSuitableForPassengers(passengerCount: number): Promise<VehicleResponseDto[]> {
    try {
      const vehicles = await this.vehicleModel
        .find({
          'capacity.maxPassengers': { $gte: passengerCount },
          isActive: true,
        })
        .sort({ 'capacity.maxPassengers': 1, category: 1 })
        .exec();

      return vehicles.map(vehicle => this.formatVehicleResponse(vehicle));
    } catch (error: any) {
      throw new BadRequestException(`Failed to find suitable vehicles: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Format vehicle response with proper typing
   */
  private formatVehicleResponse(vehicle: VehicleDocument): VehicleResponseDto {
    return {
      _id: (vehicle._id as Types.ObjectId).toString(),
      name: vehicle.name,
      equivalent: vehicle.equivalent,
      vehicleType: vehicle.vehicleType,
      category: vehicle.category,
      image: vehicle.image,
      capacity: vehicle.capacity,
      isElectric: vehicle.isElectric,
      isActive: vehicle.isActive,
      description: vehicle.description,
      baseRatePerKm: vehicle.baseRatePerKm,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      color: vehicle.color,
      features: vehicle.features,
      createdAt: (vehicle as any).createdAt,
      updatedAt: (vehicle as any).updatedAt,
    };
  }
}
