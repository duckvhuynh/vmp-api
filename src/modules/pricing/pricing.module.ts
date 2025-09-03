import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { PriceRegion, PriceRegionSchema } from './schemas/price-region.schema';
import { BasePrice, BasePriceSchema } from './schemas/base-price.schema';
import { Surcharge, SurchargeSchema } from './schemas/surcharge.schema';
import { FixedPrice, FixedPriceSchema } from './schemas/fixed-price.schema';

// Services
import { PriceRegionService } from './services/price-region.service';
import { BasePriceService } from './services/base-price.service';
import { SurchargeService } from './services/surcharge.service';
import { FixedPriceService } from './services/fixed-price.service';
import { PriceCalculationService } from './services/price-calculation.service';

// Controllers
import { PriceRegionController } from './controllers/price-region.controller';
import { BasePriceController } from './controllers/base-price.controller';
import { SurchargeController } from './controllers/surcharge.controller';
import { FixedPriceController } from './controllers/fixed-price.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceRegion.name, schema: PriceRegionSchema },
      { name: BasePrice.name, schema: BasePriceSchema },
      { name: Surcharge.name, schema: SurchargeSchema },
      { name: FixedPrice.name, schema: FixedPriceSchema },
    ]),
  ],
  controllers: [
    PriceRegionController,
    BasePriceController,
    SurchargeController,
    FixedPriceController,
  ],
  providers: [
    PriceRegionService,
    BasePriceService,
    SurchargeService,
    FixedPriceService,
    PriceCalculationService,
  ],
  exports: [
    PriceRegionService,
    BasePriceService,
    SurchargeService,
    FixedPriceService,
    PriceCalculationService,
  ],
})
export class PricingModule {}
