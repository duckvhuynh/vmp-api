import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AdminBookingsController } from './controllers/admin-bookings.controller';
import { AdminBookingsService } from './services/admin-bookings.service';
import { SimpleBooking, SimpleBookingSchema } from './schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverSchema } from '../drivers/schemas/simple-driver.schema';
import { Quote, QuoteSchema } from '../quotes/schemas/simple-quote.schema';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimpleBooking.name, schema: SimpleBookingSchema },
      { name: SimpleDriver.name, schema: SimpleDriverSchema },
      { name: Quote.name, schema: QuoteSchema },
    ]),
    VehiclesModule,
  ],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService, AdminBookingsService],
  exports: [BookingsService, AdminBookingsService],
})
export class BookingsModule {}
