import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { SimpleBooking, SimpleBookingSchema } from '../bookings/schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverSchema } from '../drivers/schemas/simple-driver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimpleBooking.name, schema: SimpleBookingSchema },
      { name: SimpleDriver.name, schema: SimpleDriverSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

