import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BasePrice, BasePriceDocument } from '../schemas/base-price.schema';
import { PriceRegion, PriceRegionDocument } from '../schemas/price-region.schema';
import { Vehicle, VehicleDocument } from '../../vehicles/schemas/vehicle.schema';
import { 
  CreateBasePriceDto, 
  UpdateBasePriceDto, 
  BasePriceResponseDto, 
  BasePriceListResponseDto,
  VehiclePricingResponseDto,
  VehicleInfoDto,
  RegionInfoDto,
} from '../dto/base-price.dto';
import { BasePriceQueryDto } from '../dto/common.dto';

@Injectable()
export class BasePriceService {
  constructor(
    @InjectModel(BasePrice.name) private basePriceModel: Model<BasePriceDocument>,
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async create(createBasePriceDto: CreateBasePriceDto): Promise<BasePriceResponseDto> {
    // Verify region exists
    const region = await this.priceRegionModel.findById(createBasePriceDto.regionId).exec();
    if (!region) {
      throw new BadRequestException(`Price region with ID ${createBasePriceDto.regionId} not found`);
    }

    // Verify all vehicles exist
    if (createBasePriceDto.vehiclePrices && createBasePriceDto.vehiclePrices.length > 0) {
      const vehicleIds = createBasePriceDto.vehiclePrices.map(vp => vp.vehicleId);
      const vehicles = await this.vehicleModel.find({ _id: { $in: vehicleIds } }).exec();
      
      if (vehicles.length !== vehicleIds.length) {
        const foundIds = vehicles.map(v => (v._id as Types.ObjectId).toString());
        const missingIds = vehicleIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Vehicles not found: ${missingIds.join(', ')}`);
      }
    }

    // Check for existing base price for this region
    const existing = await this.basePriceModel
      .findOne({
        regionId: createBasePriceDto.regionId,
        isActive: true,
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `Active base price already exists for region ${createBasePriceDto.regionId}. Use update to modify vehicle prices.`
      );
    }

    const createdBasePrice = new this.basePriceModel({
      ...createBasePriceDto,
      vehiclePrices: createBasePriceDto.vehiclePrices.map(vp => ({
        ...vp,
        vehicleId: new Types.ObjectId(vp.vehicleId),
      })),
    });
    
    const savedBasePrice = await createdBasePrice.save();
    
    // Populate and return
    const populated = await this.basePriceModel
      .findById(savedBasePrice._id)
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();
    
    return this.toResponseDto(populated!);
  }

  async findAll(query: BasePriceQueryDto): Promise<BasePriceListResponseDto> {
    const { page = 1, limit = 10, search, isActive, regionId, vehicleClass, currency } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (search) {
      // Search in related region name
      const regions = await this.priceRegionModel
        .find({ name: { $regex: search, $options: 'i' } })
        .select('_id')
        .exec();
      
      if (regions.length > 0) {
        filter.regionId = { $in: regions.map(r => r._id) };
      } else {
        // No matching regions, return empty results
        return {
          data: [],
          total: 0,
          page,
          limit,
        };
      }
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (regionId) {
      filter.regionId = regionId;
    }

    // Legacy support for vehicleClass filter
    if (vehicleClass) {
      filter.vehicleClass = vehicleClass;
    }

    if (currency) {
      filter.currency = currency;
    }

    const [data, total] = await Promise.all([
      this.basePriceModel
        .find(filter)
        .populate('regionId', 'name tags')
        .populate('vehiclePrices.vehicleId', 'name category image capacity')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.basePriceModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map(basePrice => this.toResponseDto(basePrice)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<BasePriceResponseDto> {
    const basePrice = await this.basePriceModel
      .findById(id)
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();
      
    if (!basePrice) {
      throw new NotFoundException(`Base price with ID ${id} not found`);
    }
    return this.toResponseDto(basePrice);
  }

  async update(id: string, updateBasePriceDto: UpdateBasePriceDto): Promise<BasePriceResponseDto> {
    // If regionId is being updated, verify it exists
    if (updateBasePriceDto.regionId) {
      const region = await this.priceRegionModel.findById(updateBasePriceDto.regionId).exec();
      if (!region) {
        throw new BadRequestException(`Price region with ID ${updateBasePriceDto.regionId} not found`);
      }
    }

    // Verify all vehicles exist if updating vehiclePrices
    if (updateBasePriceDto.vehiclePrices && updateBasePriceDto.vehiclePrices.length > 0) {
      const vehicleIds = updateBasePriceDto.vehiclePrices.map(vp => vp.vehicleId);
      const vehicles = await this.vehicleModel.find({ _id: { $in: vehicleIds } }).exec();
      
      if (vehicles.length !== vehicleIds.length) {
        const foundIds = vehicles.map(v => (v._id as Types.ObjectId).toString());
        const missingIds = vehicleIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Vehicles not found: ${missingIds.join(', ')}`);
      }
    }

    // Prepare update data
    const updateData: any = { ...updateBasePriceDto };
    if (updateBasePriceDto.vehiclePrices) {
      updateData.vehiclePrices = updateBasePriceDto.vehiclePrices.map(vp => ({
        ...vp,
        vehicleId: new Types.ObjectId(vp.vehicleId),
      }));
    }

    const updatedBasePrice = await this.basePriceModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();

    if (!updatedBasePrice) {
      throw new NotFoundException(`Base price with ID ${id} not found`);
    }

    return this.toResponseDto(updatedBasePrice);
  }

  async remove(id: string): Promise<void> {
    const result = await this.basePriceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Base price with ID ${id} not found`);
    }
  }

  /**
   * Find base price by region and vehicle ID
   */
  async findByRegionAndVehicleId(regionId: string, vehicleId: string): Promise<BasePriceResponseDto | null> {
    const basePrice = await this.basePriceModel
      .findOne({
        regionId,
        'vehiclePrices.vehicleId': vehicleId,
        isActive: true,
        $and: [
          {
            $or: [
              { validFrom: { $exists: false } },
              { validFrom: { $lte: new Date() } }
            ]
          },
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: new Date() } }
            ]
          }
        ]
      })
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();

    return basePrice ? this.toResponseDto(basePrice) : null;
  }

  /**
   * Legacy method - find by region and vehicle class
   * Kept for backward compatibility
   */
  async findByRegionAndVehicleClass(regionId: string, vehicleClass: string): Promise<BasePriceResponseDto | null> {
    const basePrice = await this.basePriceModel
      .findOne({
        regionId,
        vehicleClass,
        isActive: true,
        $and: [
          {
            $or: [
              { validFrom: { $exists: false } },
              { validFrom: { $lte: new Date() } }
            ]
          },
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: new Date() } }
            ]
          }
        ]
      })
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();

    return basePrice ? this.toResponseDto(basePrice) : null;
  }

  /**
   * Find all base prices for a region
   */
  async findByRegion(regionId: string): Promise<BasePriceResponseDto[]> {
    const basePrices = await this.basePriceModel
      .find({
        regionId,
        isActive: true,
        $and: [
          {
            $or: [
              { validFrom: { $exists: false } },
              { validFrom: { $lte: new Date() } }
            ]
          },
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: new Date() } }
            ]
          }
        ]
      })
      .populate('regionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();

    return basePrices.map(bp => this.toResponseDto(bp));
  }

  private toResponseDto(basePrice: BasePriceDocument): BasePriceResponseDto {
    // Handle populated regionId
    const regionId = basePrice.regionId as any;
    let regionIdString: string;
    let region: RegionInfoDto | undefined;

    if (regionId && typeof regionId === 'object' && regionId._id) {
      regionIdString = regionId._id.toString();
      region = {
        _id: regionId._id.toString(),
        name: regionId.name || '',
        tags: regionId.tags || [],
      };
    } else {
      regionIdString = regionId ? String(regionId) : '';
    }

    // Map vehicle prices
    const vehiclePrices: VehiclePricingResponseDto[] = (basePrice.vehiclePrices || []).map(vp => {
      const vehicleData = vp.vehicleId as any;
      let vehicleIdString: string;
      let vehicle: VehicleInfoDto | undefined;

      if (vehicleData && typeof vehicleData === 'object' && vehicleData._id) {
        vehicleIdString = vehicleData._id.toString();
        vehicle = {
          _id: vehicleData._id.toString(),
          name: vehicleData.name?.value || vehicleData.name?.translations?.en || '',
          category: vehicleData.category || '',
          image: vehicleData.image,
          maxPassengers: vehicleData.capacity?.maxPassengers || 0,
          maxLuggage: vehicleData.capacity?.maxLuggage || 0,
        };
      } else {
        vehicleIdString = vehicleData ? String(vehicleData) : '';
      }

      return {
        vehicleId: vehicleIdString,
        vehicle,
        baseFare: vp.baseFare,
        pricePerKm: vp.pricePerKm,
        pricePerMinute: vp.pricePerMinute,
        minimumFare: vp.minimumFare,
      };
    });

    return {
      _id: basePrice._id.toString(),
      regionId: regionIdString,
      region,
      currency: basePrice.currency,
      vehiclePrices,
      isActive: basePrice.isActive,
      validFrom: basePrice.validFrom,
      validUntil: basePrice.validUntil,
      createdAt: basePrice.createdAt,
      updatedAt: basePrice.updatedAt,
      // Legacy fields
      vehicleClass: basePrice.vehicleClass,
      baseFare: basePrice.baseFare,
      pricePerKm: basePrice.pricePerKm,
      pricePerMinute: basePrice.pricePerMinute,
      minimumFare: basePrice.minimumFare,
    };
  }
}
