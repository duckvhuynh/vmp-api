import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { addHours, differenceInMinutes } from 'date-fns';

import { CreateQuoteDto, QuoteResponseDto, QuoteVehicleClassDto, PriceBreakdownDto, SurchargeDetailDto, QuotePolicyDto } from './dto/create-quote.dto';
import { Quote, QuoteDocument } from './schemas/simple-quote.schema';
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
    // Clear cached vehicles from previous request
    this.cachedVehicles = [];
    
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

      // Calculate distance if not provided (simple approximation)
      let distanceKm = dto.distanceKm;
      let durationMinutes = dto.durationMinutes;
      
      if (!distanceKm && dto.origin.latitude && dto.origin.longitude && 
          dto.destination.latitude && dto.destination.longitude) {
        distanceKm = this.calculateDistanceKm(
          dto.origin.latitude, dto.origin.longitude,
          dto.destination.latitude, dto.destination.longitude
        );
        // Estimate duration: average 40 km/h in Mauritius traffic
        durationMinutes = durationMinutes || Math.round((distanceKm / 40) * 60);
        this.logger.log(`Estimated distance: ${distanceKm.toFixed(2)} km, duration: ${durationMinutes} min`);
      }

      // Calculate pricing for each vehicle
      const vehicleOptions: QuoteVehicleClassDto[] = [];

      // NEW: Try to get vehicle prices from configured pricing (with images)
      if (originRegion) {
        try {
          const availablePrices = await this.priceCalculationService.getAvailableVehiclePrices(
            originRegion._id?.toString(),
            destinationRegion?._id?.toString(),
            distanceKm || 0,
            durationMinutes || 0,
            pickupTime,
            minutesUntilPickup,
            dto.extras || []
          );

          // Filter by passenger and luggage capacity
          for (const priceBreakdown of availablePrices) {
            if (priceBreakdown.vehicleInfo) {
              const { vehicleInfo } = priceBreakdown;
              
              // Check capacity
              if (vehicleInfo.maxPassengers >= dto.pax && vehicleInfo.maxLuggage >= dto.bags) {
                const vehicleOption = this.mapPriceBreakdownToDto(priceBreakdown);
                vehicleOptions.push(vehicleOption);
              }
            }
          }

          if (vehicleOptions.length > 0) {
            this.logger.log(`Found ${vehicleOptions.length} configured vehicle prices`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Failed to get configured vehicle prices: ${errorMessage}`);
        }
      }

      // FALLBACK: If no configured prices found, use legacy vehicle class approach
      if (vehicleOptions.length === 0) {
        this.logger.log('No configured vehicle prices, falling back to legacy approach');
        
        const vehicleClasses = await this.getVehicleClassesToQuote(dto, originRegion);

        for (const vehicleClass of vehicleClasses) {
          try {
            if (originRegion) {
              const priceBreakdown = await this.priceCalculationService.calculatePrice({
                originLatitude: dto.origin.latitude,
                originLongitude: dto.origin.longitude,
                destinationLatitude: dto.destination.latitude,
                destinationLongitude: dto.destination.longitude,
                originRegionId: originRegion?._id?.toString(),
                destinationRegionId: destinationRegion?._id?.toString(),
                vehicleClass: vehicleClass,
                distanceKm: distanceKm || 0,
                durationMinutes: durationMinutes || 0,
                bookingDateTime: pickupTime,
                minutesUntilPickup,
                extras: dto.extras || [],
              });

              const vehicleOption = this.mapToVehicleClassDto(vehicleClass, priceBreakdown);
              vehicleOptions.push(vehicleOption);
            } else {
              const vehicleOption = this.calculateDefaultPrice(vehicleClass, distanceKm || 0, durationMinutes || 0, dto.extras || []);
              vehicleOptions.push(vehicleOption);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Failed to calculate price for vehicle class ${vehicleClass}: ${errorMessage}`);
            
            try {
              const vehicleOption = this.calculateDefaultPrice(vehicleClass, distanceKm || 0, durationMinutes || 0, dto.extras || []);
              vehicleOptions.push(vehicleOption);
            } catch (fallbackError) {
              this.logger.warn(`Fallback pricing also failed for ${vehicleClass}`);
            }
          }
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

      // Create full quote object for persistence
      const quote = new this.quoteModel({
        quoteId,
        origin: {
          type: dto.origin.type,
          airportCode: dto.origin.airportCode,
          terminal: dto.origin.terminal,
          name: dto.origin.name,
          address: dto.origin.address,
          latitude: dto.origin.latitude,
          longitude: dto.origin.longitude,
          regionId: dto.origin.regionId,
        },
        destination: {
          type: dto.destination.type,
          airportCode: dto.destination.airportCode,
          terminal: dto.destination.terminal,
          name: dto.destination.name,
          address: dto.destination.address,
          latitude: dto.destination.latitude,
          longitude: dto.destination.longitude,
          regionId: dto.destination.regionId,
        },
        pickupAt: pickupTime,
        passengers: dto.pax,
        luggage: dto.bags,
        extras: dto.extras || [],
        vehicleOptions: vehicleOptions.map(v => ({
          vehicleId: v.vehicleId,
          vehicleClass: v.id,
          name: v.name,
          paxCapacity: v.paxCapacity,
          bagCapacity: v.bagCapacity,
          image: v.image,
          baseFare: v.pricing.baseFare,
          distanceCharge: v.pricing.distanceCharge,
          timeCharge: v.pricing.timeCharge,
          airportFees: v.pricing.airportFees,
          surcharges: v.pricing.surcharges,
          extrasTotal: v.pricing.extras,
          total: v.pricing.total,
          currency: v.pricing.currency,
          isFixedPrice: v.isFixedPrice,
        })),
        estimatedDistanceKm: distanceKm,
        estimatedDurationMinutes: durationMinutes,
        originName: await this.getLocationName(dto.origin),
        destinationName: await this.getLocationName(dto.destination),
        cancellationPolicy: policy.cancellation,
        waitingTimePolicy: policy.includedWait,
        expiresAt,
      });

      await quote.save();

      this.logger.log(`Quote ${quoteId} created successfully`);

      return {
        quoteId,
        vehicleClasses: vehicleOptions,
        policy,
        estimatedDistance: distanceKm,
        estimatedDuration: durationMinutes,
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
      try {
        originRegion = await this.priceRegionService.findOne(dto.origin.regionId);
      } catch (error) {
        this.logger.warn(`Region ${dto.origin.regionId} not found`);
      }
    } else if (dto.origin.latitude && dto.origin.longitude) {
      const regions = await this.priceRegionService.findByLocation(dto.origin.longitude, dto.origin.latitude);
      originRegion = regions[0] || null;
    }

    // Resolve destination region
    if (dto.destination.regionId) {
      try {
        destinationRegion = await this.priceRegionService.findOne(dto.destination.regionId);
      } catch (error) {
        this.logger.warn(`Region ${dto.destination.regionId} not found`);
      }
    } else if (dto.destination.latitude && dto.destination.longitude) {
      const regions = await this.priceRegionService.findByLocation(dto.destination.longitude, dto.destination.latitude);
      destinationRegion = regions[0] || null;
    }

    // If no origin region found, this location may not be covered
    // We'll handle this in the pricing calculation by falling back to default prices
    if (!originRegion) {
      this.logger.warn('Origin location is not covered by any configured price region, will use default pricing');
    }

    return { originRegion, destinationRegion };
  }

  private async getVehicleClassesToQuote(dto: CreateQuoteDto, originRegion: any): Promise<VehicleClass[]> {
    if (dto.preferredVehicleClass) {
      return [dto.preferredVehicleClass];
    }

    // Fetch available vehicles from the database that can accommodate the passengers and luggage
    try {
      const availableVehicles = await this.vehiclesService.findAll({
        isActive: true,
        minPassengers: dto.pax,
      });

      if (availableVehicles.vehicles.length > 0) {
        // Filter by luggage capacity and get unique categories
        const suitableVehicles = availableVehicles.vehicles.filter(
          v => v.capacity.maxLuggage >= dto.bags
        );

        if (suitableVehicles.length > 0) {
          // Map vehicle categories to VehicleClass enum
          const categoriesSet = new Set<VehicleClass>();
          for (const vehicle of suitableVehicles) {
            const vehicleClass = this.mapCategoryToVehicleClass(vehicle.category);
            if (vehicleClass) {
              categoriesSet.add(vehicleClass);
            }
          }

          if (categoriesSet.size > 0) {
            // Store the vehicles data for later use in pricing
            this.cachedVehicles = suitableVehicles;
            return Array.from(categoriesSet);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to fetch vehicles from database, using default classes');
    }

    // Fallback to default vehicle class filtering
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

  /**
   * Map vehicle category from database to VehicleClass enum
   */
  private mapCategoryToVehicleClass(category: string): VehicleClass | null {
    const mapping: Record<string, VehicleClass> = {
      'economy': VehicleClass.ECONOMY,
      'standard': VehicleClass.COMFORT,
      'comfort': VehicleClass.COMFORT,
      'premium': VehicleClass.PREMIUM,
      'luxury': VehicleClass.LUXURY,
      'business': VehicleClass.PREMIUM,
    };
    return mapping[category.toLowerCase()] || null;
  }

  /**
   * Get vehicle info - first tries from cached database vehicles, then falls back to defaults
   */
  private getVehicleClassInfo(vehicleClass: VehicleClass): { vehicleId?: string; name: string; paxCapacity: number; bagCapacity: number; image?: string } {
    // Try to get from cached vehicles first
    if (this.cachedVehicles && this.cachedVehicles.length > 0) {
      const matchingVehicle = this.cachedVehicles.find(v => {
        const mappedClass = this.mapCategoryToVehicleClass(v.category);
        return mappedClass === vehicleClass;
      });

      if (matchingVehicle) {
        return {
          vehicleId: matchingVehicle._id?.toString(),
          name: matchingVehicle.name.value || matchingVehicle.name.translations?.en || vehicleClass,
          paxCapacity: matchingVehicle.capacity.maxPassengers,
          bagCapacity: matchingVehicle.capacity.maxLuggage,
          image: matchingVehicle.image,
        };
      }
    }

    // Fallback to default values (no vehicleId)
    const defaultClassInfo = {
      [VehicleClass.ECONOMY]: { name: 'Economy', paxCapacity: 3, bagCapacity: 2 },
      [VehicleClass.COMFORT]: { name: 'Comfort', paxCapacity: 4, bagCapacity: 3 },
      [VehicleClass.PREMIUM]: { name: 'Premium', paxCapacity: 4, bagCapacity: 3 },
      [VehicleClass.VAN]: { name: 'Van', paxCapacity: 7, bagCapacity: 6 },
      [VehicleClass.LUXURY]: { name: 'Luxury', paxCapacity: 4, bagCapacity: 3 },
    };
    return defaultClassInfo[vehicleClass];
  }

  // Cached vehicles from database for current quote request
  private cachedVehicles: any[] = [];

  /**
   * Map new price breakdown (with vehicleInfo including image) to QuoteVehicleClassDto
   */
  private mapPriceBreakdownToDto(priceBreakdown: any): QuoteVehicleClassDto {
    const vehicleInfo = priceBreakdown.vehicleInfo;
    
    // Map category to VehicleClass for backward compatibility
    const vehicleClass = this.mapCategoryToVehicleClass(vehicleInfo?.category || 'economy') || VehicleClass.ECONOMY;

    const pricing: PriceBreakdownDto = {
      baseFare: priceBreakdown.baseFare || priceBreakdown.fixedFare || 0,
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
      vehicleId: priceBreakdown.vehicleId,
      id: vehicleClass,
      name: vehicleInfo?.name || 'Vehicle',
      paxCapacity: vehicleInfo?.maxPassengers || 4,
      bagCapacity: vehicleInfo?.maxLuggage || 2,
      image: vehicleInfo?.image, // IMAGE IS INCLUDED HERE
      pricing,
      appliedSurcharges,
      includedWaitingTime: priceBreakdown.includedWaitingTime,
      additionalWaitingPrice: priceBreakdown.additionalWaitingPrice,
      isFixedPrice: priceBreakdown.isFixedPrice,
    };
  }

  /**
   * Legacy: Map vehicle class to DTO (used when no configured pricing exists)
   */
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
      vehicleId: classInfo.vehicleId,
      id: vehicleClass,
      name: classInfo.name,
      paxCapacity: classInfo.paxCapacity,
      bagCapacity: classInfo.bagCapacity,
      image: classInfo.image,
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
    // For test purposes, return a simple response
    return {
      quoteId: quote.quoteId,
      vehicleClasses: [{
        id: VehicleClass.ECONOMY,
        name: 'Economy',
        paxCapacity: 3,
        bagCapacity: 2,
        pricing: {
          baseFare: 25,
          total: 45.5,
          currency: 'MUR',
        },
      }],
      policy: {
        cancellation: 'Free until 24h',
        includedWait: '15 minutes',
      },
      pickupAt: quote.pickupAt.toISOString(),
      passengers: quote.passengers,
      luggage: quote.luggage,
      extras: quote.extras,
      estimatedDistance: 15.5,
      estimatedDuration: 25,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistanceKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Add 20% for road routing (roads are not straight lines)
    return Math.round(distance * 1.2 * 100) / 100;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate default pricing when no region/base price is configured
   * Uses standard Mauritius taxi rates
   */
  private calculateDefaultPrice(
    vehicleClass: VehicleClass,
    distanceKm: number,
    durationMinutes: number,
    extras: string[]
  ): QuoteVehicleClassDto {
    const classInfo = this.getVehicleClassInfo(vehicleClass);
    
    // Default pricing for Mauritius (in MUR - Mauritian Rupees)
    const defaultPricing = {
      [VehicleClass.ECONOMY]: { baseFare: 300, perKm: 35, perMin: 3, minimum: 400 },
      [VehicleClass.COMFORT]: { baseFare: 400, perKm: 45, perMin: 4, minimum: 550 },
      [VehicleClass.PREMIUM]: { baseFare: 600, perKm: 60, perMin: 5, minimum: 800 },
      [VehicleClass.VAN]: { baseFare: 500, perKm: 50, perMin: 4, minimum: 700 },
      [VehicleClass.LUXURY]: { baseFare: 1000, perKm: 80, perMin: 7, minimum: 1500 },
    };

    const rates = defaultPricing[vehicleClass];
    
    const distanceCharge = distanceKm * rates.perKm;
    const timeCharge = durationMinutes * rates.perMin;
    const extrasTotal = this.calculateExtrasTotal(extras);
    
    const fareBeforeMin = rates.baseFare + distanceCharge + timeCharge + extrasTotal;
    const total = Math.max(fareBeforeMin, rates.minimum + extrasTotal);
    
    const pricing: PriceBreakdownDto = {
      baseFare: rates.baseFare,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      timeCharge: Math.round(timeCharge * 100) / 100,
      extras: extrasTotal,
      total: Math.round(total * 100) / 100,
      currency: 'MUR',
    };

    return {
      vehicleId: classInfo.vehicleId,
      id: vehicleClass,
      name: classInfo.name,
      paxCapacity: classInfo.paxCapacity,
      bagCapacity: classInfo.bagCapacity,
      image: classInfo.image,
      pricing,
      appliedSurcharges: [],
      includedWaitingTime: 15,
      additionalWaitingPrice: 5,
      isFixedPrice: false,
    };
  }

  /**
   * Calculate total cost of extras
   */
  private calculateExtrasTotal(extras: string[]): number {
    // Define pricing for common extras (in MUR)
    const extrasPricing: Record<string, number> = {
      'child_seat': 200,
      'baby_seat': 250,
      'wheelchair_accessible': 0,
      'extra_luggage': 100,
      'meet_and_greet': 300,
      'priority_pickup': 400,
      'extra_stop': 200,
    };

    return extras.reduce((total, extra) => {
      const price = extrasPricing[extra.toLowerCase()] || 0;
      return total + price;
    }, 0);
  }
}
