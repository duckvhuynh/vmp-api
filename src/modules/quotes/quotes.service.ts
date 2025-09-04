import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { addHours, differenceInMinutes } from 'date-fns';

import { CreateQuoteDto, QuoteResponseDto, QuoteVehicleClassDto, PriceBreakdownDto, SurchargeDetailDto, QuotePolicyDto } from './dto/create-quote.dto';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { PriceCalculationService } from '../pricing/services/price-calculation.service';
import { PriceRegionService } from '../pricing/services/price-region.service';
import { VehicleClass } from '../pricing/schemas/base-price.schema';
import { VehiclesService } from '../vehicles/services/vehicles.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    private readonly priceCalculationService: PriceCalculationService,
    private readonly priceRegionService: PriceRegionService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    try {
      this.logger.log(`Creating quote for pickup at ${dto.pickupAt}`);

      // Validate pickup time is in the future
      const pickupTime = new Date(dto.pickupAt);
      const now = new Date();
      if (pickupTime <= now) {
        throw new BadRequestException('Pickup time must be in the future');
      }

      // Calculate minutes until pickup for surcharge calculations
      const minutesUntilPickup = differenceInMinutes(pickupTime, now);

      // Resolve regions for origin and destination
      const { originRegion, destinationRegion } = await this.resolveRegions(dto);

      // Get vehicle classes to quote
      const vehicleClasses = await this.getVehicleClassesToQuote(dto, originRegion);

      // Calculate pricing for each vehicle class
      const vehicleOptions: QuoteVehicleClassDto[] = [];

      for (const vehicleClass of vehicleClasses) {
        try {
          const priceBreakdown = await this.priceCalculationService.calculatePrice({
            originLatitude: dto.origin.latitude,
            originLongitude: dto.origin.longitude,
            destinationLatitude: dto.destination.latitude,
            destinationLongitude: dto.destination.longitude,
            originRegionId: originRegion?._id?.toString(),
            destinationRegionId: destinationRegion?._id?.toString(),
            vehicleClass: vehicleClass,
            distanceKm: dto.distanceKm || 0,
            durationMinutes: dto.durationMinutes || 0,
            bookingDateTime: pickupTime,
            minutesUntilPickup,
            extras: dto.extras || [],
          });

          const vehicleOption = this.mapToVehicleClassDto(vehicleClass, priceBreakdown);
          vehicleOptions.push(vehicleOption);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Failed to calculate price for vehicle class ${vehicleClass}: ${errorMessage}`);
          // Continue with other vehicle classes
        }
      }

      if (vehicleOptions.length === 0) {
        throw new BadRequestException('No pricing available for the requested route');
      }

      // Generate quote
      const quoteId = randomUUID();
      const expiresAt = addHours(now, 1); // Quote expires in 1 hour

      // Build policy information
      const policy = this.buildPolicyInfo(dto, vehicleOptions[0]);

      // Create quote object for persistence
      const quote = new this.quoteModel({
        quoteId,
        origin: {
          type: dto.origin.type,
          airportCode: dto.origin.airportCode,
          terminal: dto.origin.terminal,
          address: dto.origin.address,
          latitude: dto.origin.latitude,
          longitude: dto.origin.longitude,
          regionId: originRegion?._id,
          name: await this.getLocationName(dto.origin),
        },
        destination: {
          type: dto.destination.type,
          airportCode: dto.destination.airportCode,
          terminal: dto.destination.terminal,
          address: dto.destination.address,
          latitude: dto.destination.latitude,
          longitude: dto.destination.longitude,
          regionId: destinationRegion?._id,
          name: await this.getLocationName(dto.destination),
        },
        pickupAt: pickupTime,
        passengers: dto.pax,
        luggage: dto.bags,
        extras: dto.extras || [],
        vehicleOptions: vehicleOptions.map(vo => ({
          vehicleClass: vo.id,
          name: vo.name,
          paxCapacity: vo.paxCapacity,
          bagCapacity: vo.bagCapacity,
          pricing: vo.pricing,
          appliedSurcharges: vo.appliedSurcharges,
          includedWaitingTime: vo.includedWaitingTime,
          additionalWaitingPrice: vo.additionalWaitingPrice,
          isFixedPrice: vo.isFixedPrice,
        })),
        policy: {
          cancellation: policy.cancellation,
          includedWait: policy.includedWait,
          additionalWaitCharge: policy.additionalWaitCharge,
          quoteExpiresAt: expiresAt,
        },
        estimatedDistance: dto.distanceKm,
        estimatedDuration: dto.durationMinutes,
        originName: await this.getLocationName(dto.origin),
        destinationName: await this.getLocationName(dto.destination),
        expiresAt,
      });

      await quote.save();

      this.logger.log(`Quote ${quoteId} created successfully`);

      return {
        quoteId,
        vehicleClasses: vehicleOptions,
        policy,
        estimatedDistance: dto.distanceKm,
        estimatedDuration: dto.durationMinutes,
        originName: await this.getLocationName(dto.origin),
        destinationName: await this.getLocationName(dto.destination),
        pickupAt: dto.pickupAt,
        passengers: dto.pax,
        luggage: dto.bags,
        extras: dto.extras,
        createdAt: now,
        expiresAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create quote: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findOne(quoteId: string): Promise<QuoteResponseDto> {
    const quote = await this.quoteModel.findOne({ quoteId }).exec();
    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    if (quote.expiresAt < new Date()) {
      throw new BadRequestException(`Quote ${quoteId} has expired`);
    }

    return this.mapQuoteToResponse(quote);
  }

  private async resolveRegions(dto: CreateQuoteDto) {
    let originRegion = null;
    let destinationRegion = null;

    // Resolve origin region
    if (dto.origin.regionId) {
      originRegion = await this.priceRegionService.findOne(dto.origin.regionId);
    } else if (dto.origin.latitude && dto.origin.longitude) {
      const regions = await this.priceRegionService.findByLocation(dto.origin.longitude, dto.origin.latitude);
      originRegion = regions[0] || null;
    }

    // Resolve destination region
    if (dto.destination.regionId) {
      destinationRegion = await this.priceRegionService.findOne(dto.destination.regionId);
    } else if (dto.destination.latitude && dto.destination.longitude) {
      const regions = await this.priceRegionService.findByLocation(dto.destination.longitude, dto.destination.latitude);
      destinationRegion = regions[0] || null;
    }

    if (!originRegion) {
      throw new BadRequestException('Origin location is not covered by any price region');
    }

    return { originRegion, destinationRegion };
  }

  private async getVehicleClassesToQuote(dto: CreateQuoteDto, originRegion: any): Promise<VehicleClass[]> {
    if (dto.preferredVehicleClass) {
      return [dto.preferredVehicleClass];
    }

    // Filter vehicle classes based on passenger and luggage capacity
    const allClasses = Object.values(VehicleClass);
    const suitableClasses = [];

    for (const vehicleClass of allClasses) {
      const vehicleInfo = this.getVehicleClassInfo(vehicleClass);
      if (vehicleInfo.paxCapacity >= dto.pax && vehicleInfo.bagCapacity >= dto.bags) {
        suitableClasses.push(vehicleClass);
      }
    }

    return suitableClasses.length > 0 ? suitableClasses : [VehicleClass.ECONOMY];
  }

  private getVehicleClassInfo(vehicleClass: VehicleClass) {
    const classInfo = {
      [VehicleClass.ECONOMY]: { name: 'Economy', paxCapacity: 3, bagCapacity: 2 },
      [VehicleClass.COMFORT]: { name: 'Comfort', paxCapacity: 3, bagCapacity: 3 },
      [VehicleClass.PREMIUM]: { name: 'Premium', paxCapacity: 3, bagCapacity: 3 },
      [VehicleClass.VAN]: { name: 'Van', paxCapacity: 6, bagCapacity: 6 },
      [VehicleClass.LUXURY]: { name: 'Luxury', paxCapacity: 3, bagCapacity: 3 },
    };
    return classInfo[vehicleClass];
  }

  private mapToVehicleClassDto(vehicleClass: VehicleClass, priceBreakdown: any): QuoteVehicleClassDto {
    const classInfo = this.getVehicleClassInfo(vehicleClass);

    const pricing: PriceBreakdownDto = {
      baseFare: priceBreakdown.baseFare || 0,
      distanceCharge: priceBreakdown.distanceCharge,
      timeCharge: priceBreakdown.timeCharge,
      airportFees: priceBreakdown.airportFees,
      surcharges: priceBreakdown.totalSurcharges,
      extras: priceBreakdown.extrasTotal,
      total: priceBreakdown.total,
      currency: priceBreakdown.currency,
    };

    const appliedSurcharges: SurchargeDetailDto[] = (priceBreakdown.appliedSurcharges || []).map((surcharge: any) => ({
      name: surcharge.name,
      application: surcharge.application,
      value: surcharge.value,
      amount: surcharge.amount,
      reason: surcharge.reason,
    }));

    return {
      id: vehicleClass,
      name: classInfo.name,
      paxCapacity: classInfo.paxCapacity,
      bagCapacity: classInfo.bagCapacity,
      pricing,
      appliedSurcharges,
      includedWaitingTime: priceBreakdown.includedWaitingTime,
      additionalWaitingPrice: priceBreakdown.additionalWaitingPrice,
      isFixedPrice: priceBreakdown.isFixedPrice,
    };
  }

  private buildPolicyInfo(dto: CreateQuoteDto, vehicleOption: QuoteVehicleClassDto): QuotePolicyDto {
    const isAirportPickup = dto.origin.type === 'airport';
    const includedWaitText = isAirportPickup 
      ? '60 minutes after landing for arrivals' 
      : `${vehicleOption.includedWaitingTime || 15} minutes included`;

    const additionalWaitCharge = vehicleOption.additionalWaitingPrice 
      ? `${vehicleOption.additionalWaitingPrice} ${vehicleOption.pricing.currency} per minute`
      : undefined;

    return {
      cancellation: 'Free cancellation until 24 hours before pickup',
      includedWait: includedWaitText,
      additionalWaitCharge,
      quoteExpiresAt: addHours(new Date(), 1).toISOString(),
    };
  }

  private async getLocationName(place: any): Promise<string> {
    if (place.type === 'airport' && place.airportCode) {
      return `${place.airportCode} Airport${place.terminal ? ` - Terminal ${place.terminal}` : ''}`;
    }
    return place.address || 'Unknown Location';
  }

  private mapQuoteToResponse(quote: QuoteDocument): QuoteResponseDto {
    return {
      quoteId: quote.quoteId,
      vehicleClasses: quote.vehicleOptions.map(vo => ({
        id: vo.vehicleClass,
        name: vo.name,
        paxCapacity: vo.paxCapacity,
        bagCapacity: vo.bagCapacity,
        pricing: vo.pricing,
        appliedSurcharges: vo.appliedSurcharges,
        includedWaitingTime: vo.includedWaitingTime,
        additionalWaitingPrice: vo.additionalWaitingPrice,
        isFixedPrice: vo.isFixedPrice,
      })),
      policy: {
        cancellation: quote.policy.cancellation,
        includedWait: quote.policy.includedWait,
        additionalWaitCharge: quote.policy.additionalWaitCharge,
        quoteExpiresAt: quote.policy.quoteExpiresAt?.toISOString(),
      },
      estimatedDistance: quote.estimatedDistance,
      estimatedDuration: quote.estimatedDuration,
      originName: quote.originName,
      destinationName: quote.destinationName,
      pickupAt: quote.pickupAt.toISOString(),
      passengers: quote.passengers,
      luggage: quote.luggage,
      extras: quote.extras,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
    };
  }
}
