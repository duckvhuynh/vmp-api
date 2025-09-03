import { Injectable } from '@nestjs/common';
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
  vehicleClass: VehicleClass;
  distanceKm?: number;
  durationMinutes?: number;
  bookingDateTime: Date;
  minutesUntilPickup?: number;
}

export interface PriceBreakdown {
  baseFare?: number;
  distanceFare?: number;
  timeFare?: number;
  fixedFare?: number;
  surcharges: SurchargeDetail[];
  totalSurcharges: number;
  subtotal: number;
  total: number;
  currency: string;
  pricingMethod: 'fixed' | 'distance_based';
  includedWaitingTime?: number;
  additionalWaitingPrice?: number;
}

export interface SurchargeDetail {
  id: string;
  name: string;
  type: string;
  application: SurchargeApplication;
  value: number;
  appliedAmount: number;
  currency?: string;
}

@Injectable()
export class PriceCalculationService {
  constructor(
    private readonly priceRegionService: PriceRegionService,
    private readonly basePriceService: BasePriceService,
    private readonly surchargeService: SurchargeService,
    private readonly fixedPriceService: FixedPriceService,
  ) {}

  async calculatePrice(request: PriceCalculationRequest): Promise<PriceBreakdown> {
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
    const originRegion = originRegions[0]; // Use the first matching region
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
    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, fixedPrice.fixedPrice);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.appliedAmount, 0);

    return {
      fixedFare: fixedPrice.fixedPrice,
      surcharges: surchargeDetails,
      totalSurcharges,
      subtotal: fixedPrice.fixedPrice,
      total: fixedPrice.fixedPrice + totalSurcharges,
      currency: fixedPrice.currency,
      pricingMethod: 'fixed',
      includedWaitingTime: fixedPrice.includedWaitingTime,
      additionalWaitingPrice: fixedPrice.additionalWaitingPrice,
    };
  }

  private async calculateWithBasePrice(
    basePrice: any,
    regionId: string,
    request: PriceCalculationRequest
  ): Promise<PriceBreakdown> {
    const distanceFare = (request.distanceKm || 0) * basePrice.pricePerKm;
    const timeFare = (request.durationMinutes || 0) * basePrice.pricePerMinute;
    const subtotal = Math.max(
      basePrice.baseFare + distanceFare + timeFare,
      basePrice.minimumFare
    );

    const surcharges = await this.surchargeService.findApplicableSurcharges(
      regionId,
      request.bookingDateTime,
      request.minutesUntilPickup
    );

    const surchargeDetails = this.calculateSurcharges(surcharges, subtotal);
    const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.appliedAmount, 0);

    return {
      baseFare: basePrice.baseFare,
      distanceFare,
      timeFare,
      surcharges: surchargeDetails,
      totalSurcharges,
      subtotal,
      total: subtotal + totalSurcharges,
      currency: basePrice.currency,
      pricingMethod: 'distance_based',
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

      return {
        id: surcharge._id,
        name: surcharge.name,
        type: surcharge.type,
        application: surcharge.application,
        value: surcharge.value,
        appliedAmount: Math.round(appliedAmount * 100) / 100, // Round to 2 decimal places
        currency: surcharge.currency,
      };
    });
  }

  async getRegionsForLocation(longitude: number, latitude: number) {
    return this.priceRegionService.findByLocation(longitude, latitude);
  }

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
