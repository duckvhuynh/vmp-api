import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { SimpleBooking, SimpleBookingSchema } from '../bookings/schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverSchema } from '../drivers/schemas/simple-driver.schema';

/**
 * Notifications Module
 * 
 * Provides email notification services for:
 * - Booking confirmed (to admin and customer)
 * - Driver assigned (to driver and customer)
 * - Booking updated (to driver)
 * 
 * Uses SMTP with nodemailer for sending emails.
 * 
 * Configuration (environment variables):
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (default: 465)
 * - SMTP_SECURE: Use SSL/TLS (default: true)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: Sender email address
 * - SMTP_FROM_NAME: Sender display name
 * - SMTP_ADMIN_EMAIL: Admin email for booking notifications
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SimpleBooking.name, schema: SimpleBookingSchema },
      { name: SimpleDriver.name, schema: SimpleDriverSchema },
    ]),
  ],
  providers: [EmailService, NotificationService],
  exports: [EmailService, NotificationService],
})
export class NotificationsModule {}

