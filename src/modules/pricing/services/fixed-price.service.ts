import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FixedPrice, FixedPriceDocument } from '../schemas/fixed-price.schema';
import { PriceRegion, PriceRegionDocument } from '../schemas/price-region.schema';
import { Vehicle, VehicleDocument } from '../../vehicles/schemas/vehicle.schema';
import { 
  CreateFixedPriceDto, 
  UpdateFixedPriceDto, 
  FixedPriceResponseDto, 
  FixedPriceListResponseDto,
  VehicleFixedPricingResponseDto,
} from '../dto/fixed-price.dto';
import { RegionInfoDto, VehicleInfoDto } from '../dto/base-price.dto';
import { FixedPriceQueryDto } from '../dto/common.dto';

@Injectable()
export class FixedPriceService {
  constructor(
    @InjectModel(FixedPrice.name) private fixedPriceModel: Model<FixedPriceDocument>,
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async create(createFixedPriceDto: CreateFixedPriceDto): Promise<FixedPriceResponseDto> {
    // Verify origin region exists
    const originRegion = await this.priceRegionModel.findById(createFixedPriceDto.originRegionId).exec();
    if (!originRegion) {
      throw new BadRequestException(`Origin region with ID ${createFixedPriceDto.originRegionId} not found`);
    }

    // Verify destination region exists
    const destinationRegion = await this.priceRegionModel.findById(createFixedPriceDto.destinationRegionId).exec();
    if (!destinationRegion) {
      throw new BadRequestException(`Destination region with ID ${createFixedPriceDto.destinationRegionId} not found`);
    }

    // Verify all vehicles exist
    if (createFixedPriceDto.vehiclePrices && createFixedPriceDto.vehiclePrices.length > 0) {
      const vehicleIds = createFixedPriceDto.vehiclePrices.map(vp => vp.vehicleId);
      const vehicles = await this.vehicleModel.find({ _id: { $in: vehicleIds } }).exec();
      
      if (vehicles.length !== vehicleIds.length) {
        const foundIds = vehicles.map(v => (v._id as Types.ObjectId).toString());
        const missingIds = vehicleIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Vehicles not found: ${missingIds.join(', ')}`);
      }
    }

    // Check for existing fixed price for this route
    const existing = await this.fixedPriceModel
      .findOne({
        originRegionId: createFixedPriceDto.originRegionId,
        destinationRegionId: createFixedPriceDto.destinationRegionId,
        isActive: true,
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `Active fixed price already exists for route ${createFixedPriceDto.originRegionId} → ${createFixedPriceDto.destinationRegionId}. Use update to modify vehicle prices.`
      );
    }

    const createdFixedPrice = new this.fixedPriceModel({
      ...createFixedPriceDto,
      vehiclePrices: createFixedPriceDto.vehiclePrices.map(vp => ({
        ...vp,
        vehicleId: new Types.ObjectId(vp.vehicleId),
      })),
    });
    
    const savedFixedPrice = await createdFixedPrice.save();
    
    // Populate and return
    const populated = await this.fixedPriceModel
      .findById(savedFixedPrice._id)
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();
    
    return this.toResponseDto(populated!);
  }

  async findAll(query: FixedPriceQueryDto): Promise<FixedPriceListResponseDto> {
    const { page = 1, limit = 10, search, isActive, originRegionId, destinationRegionId, vehicleClass, currency, tags } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (originRegionId) {
      filter.originRegionId = originRegionId;
    }

    if (destinationRegionId) {
      filter.destinationRegionId = destinationRegionId;
    }

    // Legacy support
    if (vehicleClass) {
      filter.vehicleClass = vehicleClass;
    }

    if (currency) {
      filter.currency = currency;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const [data, total] = await Promise.all([
      this.fixedPriceModel
        .find(filter)
        .populate('originRegionId', 'name tags')
        .populate('destinationRegionId', 'name tags')
        .populate('vehiclePrices.vehicleId', 'name category image capacity')
        .skip(skip)
        .limit(limit)
        .sort({ priority: -1, createdAt: -1 })
        .exec(),
      this.fixedPriceModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map(fixedPrice => this.toResponseDto(fixedPrice)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<FixedPriceResponseDto> {
    const fixedPrice = await this.fixedPriceModel
      .findById(id)
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();
      
    if (!fixedPrice) {
      throw new NotFoundException(`Fixed price with ID ${id} not found`);
    }
    return this.toResponseDto(fixedPrice);
  }

  async update(id: string, updateFixedPriceDto: UpdateFixedPriceDto): Promise<FixedPriceResponseDto> {
    // If origin region is being updated, verify it exists
    if (updateFixedPriceDto.originRegionId) {
      const originRegion = await this.priceRegionModel.findById(updateFixedPriceDto.originRegionId).exec();
      if (!originRegion) {
        throw new BadRequestException(`Origin region with ID ${updateFixedPriceDto.originRegionId} not found`);
      }
    }

    // If destination region is being updated, verify it exists
    if (updateFixedPriceDto.destinationRegionId) {
      const destinationRegion = await this.priceRegionModel.findById(updateFixedPriceDto.destinationRegionId).exec();
      if (!destinationRegion) {
        throw new BadRequestException(`Destination region with ID ${updateFixedPriceDto.destinationRegionId} not found`);
      }
    }

    // Verify all vehicles exist if updating vehiclePrices
    if (updateFixedPriceDto.vehiclePrices && updateFixedPriceDto.vehiclePrices.length > 0) {
      const vehicleIds = updateFixedPriceDto.vehiclePrices.map(vp => vp.vehicleId);
      const vehicles = await this.vehicleModel.find({ _id: { $in: vehicleIds } }).exec();
      
      if (vehicles.length !== vehicleIds.length) {
        const foundIds = vehicles.map(v => (v._id as Types.ObjectId).toString());
        const missingIds = vehicleIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Vehicles not found: ${missingIds.join(', ')}`);
      }
    }

    // Prepare update data
    const updateData: any = { ...updateFixedPriceDto };
    if (updateFixedPriceDto.vehiclePrices) {
      updateData.vehiclePrices = updateFixedPriceDto.vehiclePrices.map(vp => ({
        ...vp,
        vehicleId: new Types.ObjectId(vp.vehicleId),
      }));
    }

    const updatedFixedPrice = await this.fixedPriceModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .exec();

    if (!updatedFixedPrice) {
      throw new NotFoundException(`Fixed price with ID ${id} not found`);
    }

    return this.toResponseDto(updatedFixedPrice);
  }

  async remove(id: string): Promise<void> {
    const result = await this.fixedPriceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Fixed price with ID ${id} not found`);
    }
  }

  /**
   * Find fixed price by route and vehicle ID
   */
  async findByRouteAndVehicleId(
    originRegionId: string,
    destinationRegionId: string,
    vehicleId: string
  ): Promise<FixedPriceResponseDto | null> {
    const fixedPrice = await this.fixedPriceModel
      .findOne({
        originRegionId,
        destinationRegionId,
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
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .sort({ priority: -1 })
      .exec();

    return fixedPrice ? this.toResponseDto(fixedPrice) : null;
  }

  /**
   * Legacy method - find by route and vehicle class
   */
  async findByRoute(
    originRegionId: string,
    destinationRegionId: string,
    vehicleClass: string
  ): Promise<FixedPriceResponseDto | null> {
    const fixedPrice = await this.fixedPriceModel
      .findOne({
        originRegionId,
        destinationRegionId,
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
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .sort({ priority: -1 })
      .exec();

    return fixedPrice ? this.toResponseDto(fixedPrice) : null;
  }

  /**
   * Find all fixed prices for a route (with all vehicles)
   */
  async findByRegions(
    originRegionId: string,
    destinationRegionId: string
  ): Promise<FixedPriceResponseDto[]> {
    const fixedPrices = await this.fixedPriceModel
      .find({
        originRegionId,
        destinationRegionId,
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
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
      .populate('vehiclePrices.vehicleId', 'name category image capacity')
      .sort({ priority: -1 })
      .exec();

    return fixedPrices.map(fixedPrice => this.toResponseDto(fixedPrice));
  }

  private toResponseDto(fixedPrice: FixedPriceDocument): FixedPriceResponseDto {
    // Handle populated originRegionId
    const originRegionId = fixedPrice.originRegionId as any;
    let originRegionIdString: string;
    let originRegion: RegionInfoDto | undefined;

    if (originRegionId && typeof originRegionId === 'object' && originRegionId._id) {
      originRegionIdString = originRegionId._id.toString();
      originRegion = {
        _id: originRegionId._id.toString(),
        name: originRegionId.name || '',
        tags: originRegionId.tags || [],
      };
    } else {
      originRegionIdString = originRegionId ? String(originRegionId) : '';
    }

    // Handle populated destinationRegionId
    const destinationRegionId = fixedPrice.destinationRegionId as any;
    let destinationRegionIdString: string;
    let destinationRegion: RegionInfoDto | undefined;

    if (destinationRegionId && typeof destinationRegionId === 'object' && destinationRegionId._id) {
      destinationRegionIdString = destinationRegionId._id.toString();
      destinationRegion = {
        _id: destinationRegionId._id.toString(),
        name: destinationRegionId.name || '',
        tags: destinationRegionId.tags || [],
      };
    } else {
      destinationRegionIdString = destinationRegionId ? String(destinationRegionId) : '';
    }

    // Map vehicle prices
    const vehiclePrices: VehicleFixedPricingResponseDto[] = (fixedPrice.vehiclePrices || []).map(vp => {
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
        fixedPrice: vp.fixedPrice,
        includedWaitingTime: vp.includedWaitingTime || 15,
        additionalWaitingPrice: vp.additionalWaitingPrice,
      };
    });

    return {
      _id: fixedPrice._id.toString(),
      originRegionId: originRegionIdString,
      originRegion,
      destinationRegionId: destinationRegionIdString,
      destinationRegion,
      name: fixedPrice.name,
      currency: fixedPrice.currency,
      vehiclePrices,
      estimatedDistance: fixedPrice.estimatedDistance,
      estimatedDuration: fixedPrice.estimatedDuration,
      isActive: fixedPrice.isActive,
      priority: fixedPrice.priority,
      validFrom: fixedPrice.validFrom,
      validUntil: fixedPrice.validUntil,
      description: fixedPrice.description,
      tags: fixedPrice.tags,
      createdAt: fixedPrice.createdAt,
      updatedAt: fixedPrice.updatedAt,
      // Legacy fields
      vehicleClass: fixedPrice.vehicleClass,
      fixedPrice: fixedPrice.fixedPrice,
      includedWaitingTime: fixedPrice.includedWaitingTime,
      additionalWaitingPrice: fixedPrice.additionalWaitingPrice,
    };
  }
}
