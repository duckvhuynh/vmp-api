import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { FiservService } from './services/fiserv.service';
import { SimpleBooking, SimpleBookingSchema } from '../bookings/schemas/simple-booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimpleBooking.name, schema: SimpleBookingSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [FiservService],
  exports: [FiservService],
})
export class PaymentsModule {}
