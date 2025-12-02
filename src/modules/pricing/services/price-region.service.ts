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
      // Ensure polygon is closed (first and last coordinates must be identical)
      this.ensurePolygonClosed(createPriceRegionDto.shape.geometry);
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
        // Ensure polygon is closed (first and last coordinates must be identical)
        this.ensurePolygonClosed(updatePriceRegionDto.shape.geometry);
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
    // Get all active regions and filter them in code
    // This avoids MongoDB geo query limitations with $or and aggregation
    const allRegions = await this.priceRegionModel.find({ isActive: true }).exec();
    
    const matchingRegions: PriceRegionDocument[] = [];
    
    for (const region of allRegions) {
      if (region.shape.type === RegionShapeType.CIRCLE) {
        // For circle regions, calculate distance using Haversine formula
        if (region.shape.center && region.shape.radius) {
          const [centerLon, centerLat] = region.shape.center;
          const distanceMeters = this.calculateDistanceMeters(
            latitude, longitude, centerLat, centerLon
          );
          
          if (distanceMeters <= region.shape.radius) {
            matchingRegions.push(region);
          }
        }
      } else if (region.shape.type === RegionShapeType.POLYGON) {
        // For polygon regions, check if point is inside the polygon
        if (region.shape.geometry) {
          const isInside = this.isPointInPolygon(
            [longitude, latitude], 
            region.shape.geometry
          );
          
          if (isInside) {
            matchingRegions.push(region);
          }
        }
      }
    }

    return matchingRegions.map(region => this.toResponseDto(region));
  }

  /**
   * Ensure GeoJSON polygon is closed (first and last coordinates must be identical)
   * MongoDB requires this for geo queries
   */
  private ensurePolygonClosed(geometry: any): void {
    if (!geometry || !geometry.coordinates) return;

    // Handle both Polygon and MultiPolygon
    const polygons = geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates];

    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (ring.length > 0) {
          const first = ring[0];
          const last = ring[ring.length - 1];

          // Check if first and last coordinates are different
          if (first[0] !== last[0] || first[1] !== last[1]) {
            // Close the ring by adding the first coordinate at the end
            ring.push([...first]);
          }
        }
      }
    }

    // Update coordinates back for Polygon type
    if (geometry.type === 'Polygon') {
      geometry.coordinates = polygons[0];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  private calculateDistanceMeters(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if a point is inside a GeoJSON polygon using ray casting algorithm
   */
  private isPointInPolygon(point: [number, number], geometry: any): boolean {
    if (!geometry || !geometry.coordinates) return false;
    
    // GeoJSON polygon coordinates are [longitude, latitude]
    const [x, y] = point; // longitude, latitude
    
    // Handle both Polygon and MultiPolygon
    const polygons = geometry.type === 'MultiPolygon' 
      ? geometry.coordinates 
      : [geometry.coordinates];
    
    for (const polygon of polygons) {
      // The first array is the outer ring, subsequent arrays are holes
      const outerRing = polygon[0];
      
      if (this.isPointInRing(x, y, outerRing)) {
        // Check if point is NOT in any holes
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (this.isPointInRing(x, y, polygon[i])) {
            inHole = true;
            break;
          }
        }
        
        if (!inHole) return true;
      }
    }
    
    return false;
  }

  /**
   * Ray casting algorithm to check if point is inside a ring
   */
  private isPointInRing(x: number, y: number, ring: number[][]): boolean {
    let inside = false;
    
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
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
