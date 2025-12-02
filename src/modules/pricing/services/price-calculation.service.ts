import { Injectable, Logger } from '@nestjs/common';
import { PriceRegionService } from './price-region.service';
import { BasePriceService } from './base-price.service';
import { SurchargeService } from './surcharge.service';
import { FixedPriceService } from './fixed-price.service';
import { VehicleClass } from '../schemas/base-price.schema';
import { SurchargeApplication } from '../schemas/surcharge.schema';

export interface PriceCalculationRequest {
  originLatitude?: number;
  originLongitude?: number;
  originRegionId?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationRegionId?: string;
  vehicleId?: string;  // NEW: Vehicle ID from vehicles collection
  vehicleClass?: VehicleClass; // Legacy: kept for backward compatibility
  distanceKm?: number;
  durationMinutes?: number;
  bookingDateTime: Date;
  minutesUntilPickup?: number;
  extras?: string[];
}

export interface VehicleInfo {
  vehicleId: string;
  name: string;
  category: string;
  image?: string;
  maxPassengers: number;
  maxLuggage: number;
}

export interface PriceBreakdown {
  vehicleId?: string;
  vehicleInfo?: VehicleInfo;
  baseFare?: number;
  distanceCharge?: number;
  timeCharge?: number;
  fixedFare?: number;
  airportFees?: number;
  extrasTotal?: number;
  appliedSurcharges: SurchargeDetail[];
  totalSurcharges: number;
  subtotal: number;
  total: number;
  currency: string;
  pricingMethod: 'fixed' | 'distance_based';
  includedWaitingTime?: number;
  additionalWaitingPrice?: number;
  isFixedPrice?: boolean;
}

export interface SurchargeDetail {
  id: string;
  name: string;
  type: string;
  application: SurchargeApplication;
  value: number;
  amount: number;
  currency?: string;
  reason?: string;
}

@Injectable()
export class PriceCalculationService {
  private readonly logger = new Logger(PriceCalculationService.name);

  constructor(
    private readonly priceRegionService: PriceRegionService,
    private readonly basePriceService: BasePriceService,
    private readonly surchargeService: SurchargeService,
    private readonly fixedPriceService: FixedPriceService,
  ) {}

  /**
   * Calculate price for a specific vehicle ID (NEW method)
   */
  async calculatePriceForVehicle(request: PriceCalculationRequest): Promise<PriceBreakdown> {
    if (!request.vehicleId) {
      throw new Error('vehicleId is required for calculatePriceForVehicle');
    }

    // Step 1: Identify regions
    const originRegions = request.originRegionId
      ? [await this.priceRegionService.findOne(request.originRegionId)]
      : request.originLatitude && request.originLongitude
        ? await this.priceRegionService.findByLocation(request.originLongitude, request.originLatitude)
        : [];

    const destinationRegions = request.destinationRegionId
      ? [await this.priceRegionService.findOne(request.destinationRegionId)]
      : request.destinationLatitude && request.destinationLongitude
        ? await this.priceRegionService.findByLocation(request.destinationLongitude, request.destinationLatitude)
        : [];

    if (originRegions.length === 0) {
      throw new Error('Origin region not found or not covered by any price region');
    }

    const originRegion = originRegions[0];

    // Step 2: Try to find fixed price first (if destination is also in a region)
    if (destinationRegions.length > 0) {
      const destinationRegion = destinationRegions[0];
      
      // Find fixed price for this route
      const fixedPrices = await this.fixedPriceService.findByRegions(
        originRegion._id,
        destinationRegion._id
      );

      if (fixedPrices.length > 0) {
        // Look for pricing for this specific vehicle
        for (const fixedPrice of fixedPrices) {
          const vehiclePricing = fixedPrice.vehiclePrices?.find(
            vp => vp.vehicleId === request.vehicleId
          );

          if (vehiclePricing) {
            return this.calculateWithVehicleFixedPrice(
              fixedPrice,
              vehiclePricing,
              originRegion._id,
              request
            );
          }
        }
      }
    }

    // Step 3: Fall back to base price for this region
    const basePrices = await this.basePriceService.findByRegion(originRegion._id);
    
    for (const basePrice of basePrices) {
      const vehiclePricing = basePrice.vehiclePrices?.find(
        vp => vp.vehicleId === request.vehicleId
      );

      if (vehiclePricing) {
        return this.calculateWithVehicleBasePrice(
          basePrice,
          vehiclePricing,
          originRegion._id,
          request
        );
      }
    }

    throw new Error(`No pricing configuration found for vehicle ${request.vehicleId} in region ${originRegion._id}`);
  }

  /**
   * Get all available vehicle prices for a route
   */
  async getAvailableVehiclePrices(
    originRegionId: string,
    destinationRegionId?: string,
    distanceKm?: number,
    durationMinutes?: number,
    bookingDateTime?: Date,
    minutesUntilPickup?: number,
    extras?: string[]
  ): Promise<PriceBreakdown[]> {
    const results: PriceBreakdown[] = [];

    // Try fixed prices first if destination is provided
    if (destinationRegionId) {
      const fixedPrices = await this.fixedPriceService.findByRegions(originRegionId, destinationRegionId);
      
      for (const fixedPrice of fixedPrices) {
        for (const vehiclePricing of fixedPrice.vehiclePrices || []) {
          const breakdown = await this.calculateWithVehicleFixedPrice(
            fixedPrice,
            vehiclePricing,
            originRegionId,
            {
              originRegionId,
              destinationRegionId,
              vehicleId: vehiclePricing.vehicleId,
              distanceKm,
              durationMinutes,
              bookingDateTime: bookingDateTime || new Date(),
              minutesUntilPickup,
              extras,
            }
          );
          results.push(breakdown);
        }
      }

      // If we found fixed prices, return them
      if (results.length > 0) {
        return results;
      }
    }

    // Fall back to base prices
    const basePrices = await this.basePriceService.findByRegion(originRegionId);
    
    for (const basePrice of basePrices) {
      for (const vehiclePricing of basePrice.vehiclePrices || []) {
        const breakdown = await this.calculateWithVehicleBasePrice(
          basePrice,
          vehiclePricing,
          originRegionId,
          {
            originRegionId,
            destinationRegionId,
            vehicleId: vehiclePricing.vehicleId,
            distanceKm,
            durationMinutes,
            bookingDateTime: bookingDateTime || new Date(),
            minutesUntilPickup,
            extras,
          }
        );
        results.push(breakdown);
      }
    }

    return results;
  }

  private async calculateWithVehicleFixedPrice(
    fixedPrice: any,
    vehiclePricing: any,
    regionId: string,
    request: PriceCalculationRequest
  ): Promise<PriceBreakdown> {
    const extrasTotal = this.calculateExtras(request.extras || []);
    const subtotal = vehiclePricing.fixedPrice + extrasTotal;

    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, subtotal);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0);

    // Build vehicle info from populated data
    const vehicleInfo: VehicleInfo | undefined = vehiclePricing.vehicle ? {
      vehicleId: vehiclePricing.vehicleId,
      name: vehiclePricing.vehicle.name || '',
      category: vehiclePricing.vehicle.category || '',
      image: vehiclePricing.vehicle.image,
      maxPassengers: vehiclePricing.vehicle.maxPassengers || 0,
      maxLuggage: vehiclePricing.vehicle.maxLuggage || 0,
    } : undefined;

    return {
      vehicleId: vehiclePricing.vehicleId,
      vehicleInfo,
      fixedFare: vehiclePricing.fixedPrice,
      extrasTotal,
      appliedSurcharges: surchargeDetails,
      totalSurcharges,
      subtotal,
      total: subtotal + totalSurcharges,
      currency: fixedPrice.currency,
      pricingMethod: 'fixed',
      includedWaitingTime: vehiclePricing.includedWaitingTime || 15,
      additionalWaitingPrice: vehiclePricing.additionalWaitingPrice,
      isFixedPrice: true,
    };
  }

  private async calculateWithVehicleBasePrice(
    basePrice: any,
    vehiclePricing: any,
    regionId: string,
    request: PriceCalculationRequest
  ): Promise<PriceBreakdown> {
    const distanceCharge = (request.distanceKm || 0) * vehiclePricing.pricePerKm;
    const timeCharge = (request.durationMinutes || 0) * vehiclePricing.pricePerMinute;
    const extrasTotal = this.calculateExtras(request.extras || []);
    
    const fareBeforeMin = vehiclePricing.baseFare + distanceCharge + timeCharge + extrasTotal;
    const subtotal = Math.max(fareBeforeMin, vehiclePricing.minimumFare + extrasTotal);

    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, subtotal);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0);

    // Build vehicle info from populated data
    const vehicleInfo: VehicleInfo | undefined = vehiclePricing.vehicle ? {
      vehicleId: vehiclePricing.vehicleId,
      name: vehiclePricing.vehicle.name || '',
      category: vehiclePricing.vehicle.category || '',
      image: vehiclePricing.vehicle.image,
      maxPassengers: vehiclePricing.vehicle.maxPassengers || 0,
      maxLuggage: vehiclePricing.vehicle.maxLuggage || 0,
    } : undefined;

    return {
      vehicleId: vehiclePricing.vehicleId,
      vehicleInfo,
      baseFare: vehiclePricing.baseFare,
      distanceCharge,
      timeCharge,
      extrasTotal,
      appliedSurcharges: surchargeDetails,
      totalSurcharges,
      subtotal,
      total: subtotal + totalSurcharges,
      currency: basePrice.currency,
      pricingMethod: 'distance_based',
      isFixedPrice: false,
    };
  }

  // ============ LEGACY METHODS (kept for backward compatibility) ============

  /**
   * @deprecated Use calculatePriceForVehicle instead
   */
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceBreakdown> {
    // If vehicleId is provided, use new method
    if (request.vehicleId) {
      return this.calculatePriceForVehicle(request);
    }

    // Legacy: use vehicleClass
    if (!request.vehicleClass) {
      throw new Error('Either vehicleId or vehicleClass must be provided');
    }

    // Step 1: Identify regions
    const originRegions = request.originRegionId
      ? [await this.priceRegionService.findOne(request.originRegionId)]
      : request.originLatitude && request.originLongitude
        ? await this.priceRegionService.findByLocation(request.originLongitude, request.originLatitude)
        : [];

    const destinationRegions = request.destinationRegionId
      ? [await this.priceRegionService.findOne(request.destinationRegionId)]
      : request.destinationLatitude && request.destinationLongitude
        ? await this.priceRegionService.findByLocation(request.destinationLongitude, request.destinationLatitude)
        : [];

    if (originRegions.length === 0) {
      throw new Error('Origin region not found or not covered by any price region');
    }

    // Step 2: Try to find fixed price first (if destination is also in a region)
    if (destinationRegions.length > 0) {
      for (const originRegion of originRegions) {
        for (const destinationRegion of destinationRegions) {
          const fixedPrice = await this.fixedPriceService.findByRoute(
            originRegion._id,
            destinationRegion._id,
            request.vehicleClass
          );

          if (fixedPrice) {
            return this.calculateWithFixedPrice(fixedPrice, originRegion._id, request);
          }
        }
      }
    }

    // Step 3: Fall back to distance-based pricing
    const originRegion = originRegions[0];
    const basePrice = await this.basePriceService.findByRegionAndVehicleClass(
      originRegion._id,
      request.vehicleClass
    );

    if (!basePrice) {
      throw new Error(`No base price configuration found for region ${originRegion._id} and vehicle class ${request.vehicleClass}`);
    }

    return this.calculateWithBasePrice(basePrice, originRegion._id, request);
  }

  private async calculateWithFixedPrice(
    fixedPrice: any,
    regionId: string,
    request: PriceCalculationRequest
  ): Promise<PriceBreakdown> {
    const extrasTotal = this.calculateExtras(request.extras || []);
    // Use legacy fixedPrice field or find from vehiclePrices
    const price = fixedPrice.fixedPrice || fixedPrice.vehiclePrices?.[0]?.fixedPrice || 0;
    const subtotal = price + extrasTotal;

    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, subtotal);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0);

    return {
      fixedFare: price,
      extrasTotal,
      appliedSurcharges: surchargeDetails,
      totalSurcharges,
      subtotal,
      total: subtotal + totalSurcharges,
      currency: fixedPrice.currency,
      pricingMethod: 'fixed',
      includedWaitingTime: fixedPrice.includedWaitingTime || fixedPrice.vehiclePrices?.[0]?.includedWaitingTime || 15,
      additionalWaitingPrice: fixedPrice.additionalWaitingPrice || fixedPrice.vehiclePrices?.[0]?.additionalWaitingPrice,
      isFixedPrice: true,
    };
  }

  private async calculateWithBasePrice(
    basePrice: any,
    regionId: string,
    request: PriceCalculationRequest
  ): Promise<PriceBreakdown> {
    // Use legacy fields or find from vehiclePrices
    const baseFare = basePrice.baseFare || basePrice.vehiclePrices?.[0]?.baseFare || 0;
    const pricePerKm = basePrice.pricePerKm || basePrice.vehiclePrices?.[0]?.pricePerKm || 0;
    const pricePerMinute = basePrice.pricePerMinute || basePrice.vehiclePrices?.[0]?.pricePerMinute || 0;
    const minimumFare = basePrice.minimumFare || basePrice.vehiclePrices?.[0]?.minimumFare || 0;

    const distanceCharge = (request.distanceKm || 0) * pricePerKm;
    const timeCharge = (request.durationMinutes || 0) * pricePerMinute;
    const extrasTotal = this.calculateExtras(request.extras || []);
    
    const fareBeforeMin = baseFare + distanceCharge + timeCharge + extrasTotal;
    const subtotal = Math.max(fareBeforeMin, minimumFare + extrasTotal);

    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, subtotal);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0);

    return {
      baseFare,
      distanceCharge,
      timeCharge,
      extrasTotal,
      appliedSurcharges: surchargeDetails,
      totalSurcharges,
      subtotal,
      total: subtotal + totalSurcharges,
      currency: basePrice.currency,
      pricingMethod: 'distance_based',
      isFixedPrice: false,
    };
  }

  private calculateSurcharges(surcharges: any[], baseAmount: number): SurchargeDetail[] {
    return surcharges.map(surcharge => {
      let appliedAmount = 0;

      if (surcharge.application === SurchargeApplication.PERCENTAGE) {
        appliedAmount = (baseAmount * surcharge.value) / 100;
      } else if (surcharge.application === SurchargeApplication.FIXED_AMOUNT) {
        appliedAmount = surcharge.value;
      }

      let reason = '';
      if (surcharge.type === 'cutoff_time') {
        reason = `Booking made within ${surcharge.cutoffMinutes} minutes of pickup`;
      } else if (surcharge.type === 'time_left') {
        reason = `Pickup within next ${surcharge.timeLeftMinutes} minutes`;
      } else if (surcharge.type === 'datetime') {
        reason = surcharge.description || 'Time-based surcharge';
      }

      return {
        id: surcharge._id,
        name: surcharge.name,
        type: surcharge.type,
        application: surcharge.application,
        value: surcharge.value,
        amount: Math.round(appliedAmount * 100) / 100,
        currency: surcharge.currency,
        reason,
      };
    });
  }

  private calculateExtras(extras: string[]): number {
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

  async getRegionsForLocation(longitude: number, latitude: number) {
    return this.priceRegionService.findByLocation(longitude, latitude);
  }

  /**
   * @deprecated Use getAvailableVehiclePrices instead
   */
  async getVehicleClassPrices(regionId: string): Promise<any[]> {
    const vehicleClasses = Object.values(VehicleClass);
    const prices = await Promise.all(
      vehicleClasses.map(async (vehicleClass) => {
        const basePrice = await this.basePriceService.findByRegionAndVehicleClass(regionId, vehicleClass);
        return {
          vehicleClass,
          basePrice,
        };
      })
    );

    return prices.filter(p => p.basePrice !== null);
  }
}
