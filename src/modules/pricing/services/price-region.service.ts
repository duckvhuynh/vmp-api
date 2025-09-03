import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceRegion, PriceRegionDocument, RegionShapeType } from '../schemas/price-region.schema';
import { CreatePriceRegionDto, UpdatePriceRegionDto, PriceRegionResponseDto, PriceRegionListResponseDto } from '../dto/price-region.dto';
import { PriceRegionQueryDto } from '../dto/common.dto';

@Injectable()
export class PriceRegionService {
  constructor(
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
  ) {}

  async create(createPriceRegionDto: CreatePriceRegionDto): Promise<PriceRegionResponseDto> {
    // Validate shape data based on type
    if (createPriceRegionDto.shape.type === RegionShapeType.CIRCLE) {
      if (!createPriceRegionDto.shape.center || !createPriceRegionDto.shape.radius) {
        throw new BadRequestException('Circle shape requires center coordinates and radius');
      }
      if (createPriceRegionDto.shape.center.length !== 2) {
        throw new BadRequestException('Center coordinates must be [longitude, latitude]');
      }
    } else if (createPriceRegionDto.shape.type === RegionShapeType.POLYGON) {
      if (!createPriceRegionDto.shape.geometry) {
        throw new BadRequestException('Polygon shape requires geometry data');
      }
    }

    const createdRegion = new this.priceRegionModel(createPriceRegionDto);
    const savedRegion = await createdRegion.save();
    return this.toResponseDto(savedRegion);
  }

  async findAll(query: PriceRegionQueryDto): Promise<PriceRegionListResponseDto> {
    const { page = 1, limit = 10, search, isActive, tags } = query;
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

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const [data, total] = await Promise.all([
      this.priceRegionModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.priceRegionModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map(region => this.toResponseDto(region)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PriceRegionResponseDto> {
    const region = await this.priceRegionModel.findById(id).exec();
    if (!region) {
      throw new NotFoundException(`Price region with ID ${id} not found`);
    }
    return this.toResponseDto(region);
  }

  async update(id: string, updatePriceRegionDto: UpdatePriceRegionDto): Promise<PriceRegionResponseDto> {
    // Validate shape data if being updated
    if (updatePriceRegionDto.shape) {
      if (updatePriceRegionDto.shape.type === RegionShapeType.CIRCLE) {
        if (!updatePriceRegionDto.shape.center || !updatePriceRegionDto.shape.radius) {
          throw new BadRequestException('Circle shape requires center coordinates and radius');
        }
      } else if (updatePriceRegionDto.shape.type === RegionShapeType.POLYGON) {
        if (!updatePriceRegionDto.shape.geometry) {
          throw new BadRequestException('Polygon shape requires geometry data');
        }
      }
    }

    const updatedRegion = await this.priceRegionModel
      .findByIdAndUpdate(id, updatePriceRegionDto, { new: true })
      .exec();

    if (!updatedRegion) {
      throw new NotFoundException(`Price region with ID ${id} not found`);
    }

    return this.toResponseDto(updatedRegion);
  }

  async remove(id: string): Promise<void> {
    const result = await this.priceRegionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Price region with ID ${id} not found`);
    }
  }

  async findByLocation(longitude: number, latitude: number): Promise<PriceRegionResponseDto[]> {
    const point = [longitude, latitude];
    
    // Find regions that contain this point
    const regions = await this.priceRegionModel.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            // Circle regions
            {
              'shape.type': RegionShapeType.CIRCLE,
              'shape.center': {
                $nearSphere: {
                  $geometry: { type: 'Point', coordinates: point },
                  $maxDistance: { $expr: '$shape.radius' }
                }
              }
            },
            // Polygon regions
            {
              'shape.type': RegionShapeType.POLYGON,
              'shape.geometry': {
                $geoIntersects: {
                  $geometry: { type: 'Point', coordinates: point }
                }
              }
            }
          ]
        }
      }
    ]);

    return regions.map(region => this.toResponseDto(region));
  }

  private toResponseDto(region: PriceRegionDocument): PriceRegionResponseDto {
    return {
      _id: region._id.toString(),
      name: region.name,
      tags: region.tags,
      shape: region.shape,
      isActive: region.isActive,
      description: region.description,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
    };
  }
}
