import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AdminBookingsController } from './controllers/admin-bookings.controller';
import { AdminBookingsService } from './services/admin-bookings.service';
import { SimpleBooking, SimpleBookingSchema } from './schemas/simple-booking.schema';
import { QuotesModule } from '../quotes/quotes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimpleBooking.name, schema: SimpleBookingSchema }
    ]),
    QuotesModule,
  ],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService, AdminBookingsService],
  exports: [BookingsService, AdminBookingsService],
})
export class BookingsModule {}
