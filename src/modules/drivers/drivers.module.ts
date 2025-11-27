import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriversController } from './drivers.controller';
import { DriversService } from './services/drivers.service';
import { AdminDriversController } from './controllers/admin-drivers.controller';
import { AdminDriversService } from './services/admin-drivers.service';
import { SimpleDriver, SimpleDriverSchema } from './schemas/simple-driver.schema';
import { SimpleBooking, SimpleBookingSchema } from '../bookings/schemas/simple-booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimpleDriver.name, schema: SimpleDriverSchema },
      { name: SimpleBooking.name, schema: SimpleBookingSchema },
    ]),
  ],
  controllers: [DriversController, AdminDriversController],
  providers: [DriversService, AdminDriversService],
  exports: [DriversService, AdminDriversService],
})
export class DriversModule {}
