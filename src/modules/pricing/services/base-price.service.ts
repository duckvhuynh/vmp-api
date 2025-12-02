import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BasePrice, BasePriceDocument } from '../schemas/base-price.schema';
import { PriceRegion, PriceRegionDocument } from '../schemas/price-region.schema';
import { CreateBasePriceDto, UpdateBasePriceDto, BasePriceResponseDto, BasePriceListResponseDto } from '../dto/base-price.dto';
import { BasePriceQueryDto } from '../dto/common.dto';

@Injectable()
export class BasePriceService {
  constructor(
    @InjectModel(BasePrice.name) private basePriceModel: Model<BasePriceDocument>,
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
  ) {}

  async create(createBasePriceDto: CreateBasePriceDto): Promise<BasePriceResponseDto> {
    // Verify region exists
    const region = await this.priceRegionModel.findById(createBasePriceDto.regionId).exec();
    if (!region) {
      throw new BadRequestException(`Price region with ID ${createBasePriceDto.regionId} not found`);
    }

    // Check for duplicate region + vehicle class combination
    const existing = await this.basePriceModel
      .findOne({
        regionId: createBasePriceDto.regionId,
        vehicleClass: createBasePriceDto.vehicleClass,
        isActive: true,
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `Active base price already exists for region ${createBasePriceDto.regionId} and vehicle class ${createBasePriceDto.vehicleClass}`
      );
    }

    const createdBasePrice = new this.basePriceModel(createBasePriceDto);
    const savedBasePrice = await createdBasePrice.save();
    return this.toResponseDto(savedBasePrice);
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

    // If region or vehicle class is being updated, check for duplicates
    if (updateBasePriceDto.regionId || updateBasePriceDto.vehicleClass) {
      const currentBasePrice = await this.basePriceModel.findById(id).exec();
      if (!currentBasePrice) {
        throw new NotFoundException(`Base price with ID ${id} not found`);
      }

      const newRegionId = updateBasePriceDto.regionId || currentBasePrice.regionId;
      const newVehicleClass = updateBasePriceDto.vehicleClass || currentBasePrice.vehicleClass;

      const existing = await this.basePriceModel
        .findOne({
          _id: { $ne: id },
          regionId: newRegionId,
          vehicleClass: newVehicleClass,
          isActive: true,
        })
        .exec();

      if (existing) {
        throw new BadRequestException(
          `Active base price already exists for region ${newRegionId} and vehicle class ${newVehicleClass}`
        );
      }
    }

    const updatedBasePrice = await this.basePriceModel
      .findByIdAndUpdate(id, updateBasePriceDto, { new: true })
      .populate('regionId', 'name tags')
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
      .exec();

    return basePrice ? this.toResponseDto(basePrice) : null;
  }

  private toResponseDto(basePrice: BasePriceDocument): BasePriceResponseDto {
    // Handle populated regionId - it could be an object or just an ObjectId
    const regionId = basePrice.regionId as any;
    let regionIdString: string;
    let region: { _id: string; name: string; tags: string[] } | undefined;

    if (regionId && typeof regionId === 'object' && regionId._id) {
      // regionId is populated
      regionIdString = regionId._id.toString();
      region = {
        _id: regionId._id.toString(),
        name: regionId.name || '',
        tags: regionId.tags || [],
      };
    } else {
      // regionId is just an ObjectId
      regionIdString = regionId ? String(regionId) : '';
    }

    return {
      _id: basePrice._id.toString(),
      regionId: regionIdString,
      region,
      vehicleClass: basePrice.vehicleClass,
      baseFare: basePrice.baseFare,
      pricePerKm: basePrice.pricePerKm,
      pricePerMinute: basePrice.pricePerMinute,
      minimumFare: basePrice.minimumFare,
      currency: basePrice.currency,
      isActive: basePrice.isActive,
      validFrom: basePrice.validFrom,
      validUntil: basePrice.validUntil,
      createdAt: basePrice.createdAt,
      updatedAt: basePrice.updatedAt,
    };
  }
}
