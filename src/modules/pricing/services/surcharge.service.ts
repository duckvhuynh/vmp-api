import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Surcharge, SurchargeDocument, SurchargeType, SurchargeApplication } from '../schemas/surcharge.schema';
import { PriceRegion, PriceRegionDocument } from '../schemas/price-region.schema';
import { CreateSurchargeDto, UpdateSurchargeDto, SurchargeResponseDto, SurchargeListResponseDto } from '../dto/surcharge.dto';
import { SurchargeQueryDto } from '../dto/common.dto';

@Injectable()
export class SurchargeService {
  constructor(
    @InjectModel(Surcharge.name) private surchargeModel: Model<SurchargeDocument>,
    @InjectModel(PriceRegion.name) private priceRegionModel: Model<PriceRegionDocument>,
  ) {}

  async create(createSurchargeDto: CreateSurchargeDto): Promise<SurchargeResponseDto> {
    // Verify region exists
    const region = await this.priceRegionModel.findById(createSurchargeDto.regionId).exec();
    if (!region) {
      throw new BadRequestException(`Price region with ID ${createSurchargeDto.regionId} not found`);
    }

    // Validate surcharge data based on type
    await this.validateSurchargeData(createSurchargeDto);

    const createdSurcharge = new this.surchargeModel(createSurchargeDto);
    const savedSurcharge = await createdSurcharge.save();
    return this.toResponseDto(savedSurcharge);
  }

  async findAll(query: SurchargeQueryDto): Promise<SurchargeListResponseDto> {
    const { page = 1, limit = 10, search, isActive, regionId, type } = query;
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

    if (regionId) {
      filter.regionId = regionId;
    }

    if (type) {
      filter.type = type;
    }

    const [data, total] = await Promise.all([
      this.surchargeModel
        .find(filter)
        .populate('regionId', 'name tags')
        .skip(skip)
        .limit(limit)
        .sort({ priority: -1, createdAt: -1 })
        .exec(),
      this.surchargeModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map(surcharge => this.toResponseDto(surcharge)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<SurchargeResponseDto> {
    const surcharge = await this.surchargeModel
      .findById(id)
      .populate('regionId', 'name tags')
      .exec();
      
    if (!surcharge) {
      throw new NotFoundException(`Surcharge with ID ${id} not found`);
    }
    return this.toResponseDto(surcharge);
  }

  async update(id: string, updateSurchargeDto: UpdateSurchargeDto): Promise<SurchargeResponseDto> {
    // If regionId is being updated, verify it exists
    if (updateSurchargeDto.regionId) {
      const region = await this.priceRegionModel.findById(updateSurchargeDto.regionId).exec();
      if (!region) {
        throw new BadRequestException(`Price region with ID ${updateSurchargeDto.regionId} not found`);
      }
    }

    // Get current surcharge to merge with updates for validation
    const currentSurcharge = await this.surchargeModel.findById(id).exec();
    if (!currentSurcharge) {
      throw new NotFoundException(`Surcharge with ID ${id} not found`);
    }

    const mergedData = { ...currentSurcharge.toObject(), ...updateSurchargeDto };
    await this.validateSurchargeData(mergedData);

    const updatedSurcharge = await this.surchargeModel
      .findByIdAndUpdate(id, updateSurchargeDto, { new: true })
      .populate('regionId', 'name tags')
      .exec();

    if (!updatedSurcharge) {
      throw new NotFoundException(`Surcharge with ID ${id} not found`);
    }

    return this.toResponseDto(updatedSurcharge);
  }

  async remove(id: string): Promise<void> {
    const result = await this.surchargeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Surcharge with ID ${id} not found`);
    }
  }

  async findApplicableSurcharges(
    regionId: string,
    bookingDateTime: Date,
    minutesUntilPickup?: number
  ): Promise<SurchargeResponseDto[]> {
    const filter: any = {
      regionId,
      isActive: true,
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: { $lte: bookingDateTime } }
          ]
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: bookingDateTime } }
          ]
        }
      ]
    };

    const surcharges = await this.surchargeModel
      .find(filter)
      .populate('regionId', 'name tags')
      .sort({ priority: -1 })
      .exec();

    // Filter surcharges based on their specific conditions
    const applicableSurcharges = surcharges.filter(surcharge => {
      switch (surcharge.type) {
        case SurchargeType.CUTOFF_TIME:
          return minutesUntilPickup !== undefined && 
                 surcharge.cutoffMinutes !== undefined && 
                 minutesUntilPickup <= surcharge.cutoffMinutes;

        case SurchargeType.TIME_LEFT:
          return minutesUntilPickup !== undefined && 
                 surcharge.timeLeftMinutes !== undefined && 
                 minutesUntilPickup <= surcharge.timeLeftMinutes;

        case SurchargeType.DATETIME:
          if (surcharge.dateTimeRange) {
            // Specific date/time range
            return bookingDateTime >= surcharge.dateTimeRange.startDateTime &&
                   bookingDateTime <= surcharge.dateTimeRange.endDateTime;
          } else if (surcharge.timeRange) {
            // Recurring daily time range
            const currentTime = bookingDateTime.getHours().toString().padStart(2, '0') + 
                               ':' + bookingDateTime.getMinutes().toString().padStart(2, '0');
            const dayOfWeek = bookingDateTime.getDay();
            
            const timeInRange = this.isTimeInRange(currentTime, surcharge.timeRange.startTime, surcharge.timeRange.endTime);
            const dayMatches = !surcharge.daysOfWeek || surcharge.daysOfWeek.includes(dayOfWeek);
            
            return timeInRange && dayMatches;
          }
          return false;

        default:
          return false;
      }
    });

    return applicableSurcharges.map(surcharge => this.toResponseDto(surcharge));
  }

  private async validateSurchargeData(data: any): Promise<void> {
    // Currency is required for fixed amount surcharges
    if (data.application === SurchargeApplication.FIXED_AMOUNT && !data.currency) {
      throw new BadRequestException('Currency is required for fixed amount surcharges');
    }

    // Type-specific validations
    switch (data.type) {
      case SurchargeType.CUTOFF_TIME:
        if (data.cutoffMinutes === undefined || data.cutoffMinutes === null) {
          throw new BadRequestException('Cutoff minutes is required for cutoff time surcharges');
        }
        break;

      case SurchargeType.TIME_LEFT:
        if (data.timeLeftMinutes === undefined || data.timeLeftMinutes === null) {
          throw new BadRequestException('Time left minutes is required for time left surcharges');
        }
        break;

      case SurchargeType.DATETIME:
        if (!data.timeRange && !data.dateTimeRange) {
          throw new BadRequestException('Either time range or date time range is required for datetime surcharges');
        }
        if (data.timeRange && data.dateTimeRange) {
          throw new BadRequestException('Cannot specify both time range and date time range');
        }
        break;
    }
  }

  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    // Handle overnight ranges (e.g., 22:00 to 06:00)
    if (start > end) {
      return current >= start || current <= end;
    } else {
      return current >= start && current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private toResponseDto(surcharge: SurchargeDocument): SurchargeResponseDto {
    return {
      _id: surcharge._id.toString(),
      regionId: surcharge.regionId.toString(),
      name: surcharge.name,
      type: surcharge.type,
      application: surcharge.application,
      value: surcharge.value,
      currency: surcharge.currency,
      cutoffMinutes: surcharge.cutoffMinutes,
      timeLeftMinutes: surcharge.timeLeftMinutes,
      timeRange: surcharge.timeRange,
      dateTimeRange: surcharge.dateTimeRange ? {
        startDateTime: surcharge.dateTimeRange.startDateTime.toISOString(),
        endDateTime: surcharge.dateTimeRange.endDateTime.toISOString(),
      } : undefined,
      daysOfWeek: surcharge.daysOfWeek,
      isActive: surcharge.isActive,
      priority: surcharge.priority,
      validFrom: surcharge.validFrom,
      validUntil: surcharge.validUntil,
      description: surcharge.description,
      createdAt: surcharge.createdAt,
      updatedAt: surcharge.updatedAt,
    };
  }
}
