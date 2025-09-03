import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedPrice, FixedPriceDocument } from '../schemas/fixed-price.schema';
import { PriceRegion, PriceRegionDocument } from '../schemas/price-region.schema';
import { CreateFixedPriceDto, UpdateFixedPriceDto, FixedPriceResponseDto, FixedPriceListResponseDto } from '../dto/fixed-price.dto';
import { FixedPriceQueryDto } from '../dto/common.dto';

@Injectable()
export class FixedPriceService {
  constructor(
    @InjectModel(FixedPrice.name) private fixedPriceModel: Model<FixedPriceDocument>,
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
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

    // Check for duplicate route + vehicle class combination
    const existing = await this.fixedPriceModel
      .findOne({
        originRegionId: createFixedPriceDto.originRegionId,
        destinationRegionId: createFixedPriceDto.destinationRegionId,
        vehicleClass: createFixedPriceDto.vehicleClass,
        isActive: true,
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `Active fixed price already exists for route ${createFixedPriceDto.originRegionId} → ${createFixedPriceDto.destinationRegionId} with vehicle class ${createFixedPriceDto.vehicleClass}`
      );
    }

    const createdFixedPrice = new this.fixedPriceModel(createFixedPriceDto);
    const savedFixedPrice = await createdFixedPrice.save();
    return this.toResponseDto(savedFixedPrice);
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

    // If route or vehicle class is being updated, check for duplicates
    if (updateFixedPriceDto.originRegionId || updateFixedPriceDto.destinationRegionId || updateFixedPriceDto.vehicleClass) {
      const currentFixedPrice = await this.fixedPriceModel.findById(id).exec();
      if (!currentFixedPrice) {
        throw new NotFoundException(`Fixed price with ID ${id} not found`);
      }

      const newOriginRegionId = updateFixedPriceDto.originRegionId || currentFixedPrice.originRegionId;
      const newDestinationRegionId = updateFixedPriceDto.destinationRegionId || currentFixedPrice.destinationRegionId;
      const newVehicleClass = updateFixedPriceDto.vehicleClass || currentFixedPrice.vehicleClass;

      const existing = await this.fixedPriceModel
        .findOne({
          _id: { $ne: id },
          originRegionId: newOriginRegionId,
          destinationRegionId: newDestinationRegionId,
          vehicleClass: newVehicleClass,
          isActive: true,
        })
        .exec();

      if (existing) {
        throw new BadRequestException(
          `Active fixed price already exists for route ${newOriginRegionId} → ${newDestinationRegionId} with vehicle class ${newVehicleClass}`
        );
      }
    }

    const updatedFixedPrice = await this.fixedPriceModel
      .findByIdAndUpdate(id, updateFixedPriceDto, { new: true })
      .populate('originRegionId', 'name tags')
      .populate('destinationRegionId', 'name tags')
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
      .sort({ priority: -1 })
      .exec();

    return fixedPrice ? this.toResponseDto(fixedPrice) : null;
  }

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
      .sort({ priority: -1, vehicleClass: 1 })
      .exec();

    return fixedPrices.map(fixedPrice => this.toResponseDto(fixedPrice));
  }

  private toResponseDto(fixedPrice: FixedPriceDocument): FixedPriceResponseDto {
    return {
      _id: fixedPrice._id.toString(),
      originRegionId: fixedPrice.originRegionId.toString(),
      destinationRegionId: fixedPrice.destinationRegionId.toString(),
      name: fixedPrice.name,
      vehicleClass: fixedPrice.vehicleClass,
      fixedPrice: fixedPrice.fixedPrice,
      currency: fixedPrice.currency,
      estimatedDistance: fixedPrice.estimatedDistance,
      estimatedDuration: fixedPrice.estimatedDuration,
      includedWaitingTime: fixedPrice.includedWaitingTime,
      additionalWaitingPrice: fixedPrice.additionalWaitingPrice,
      isActive: fixedPrice.isActive,
      priority: fixedPrice.priority,
      validFrom: fixedPrice.validFrom,
      validUntil: fixedPrice.validUntil,
      description: fixedPrice.description,
      tags: fixedPrice.tags,
      createdAt: fixedPrice.createdAt,
      updatedAt: fixedPrice.updatedAt,
    };
  }
}
