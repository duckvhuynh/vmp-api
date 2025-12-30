import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailService } from './email.service';
import {
  BookingEmailData,
  formatDateTime,
  newBookingAdminTemplate,
  bookingConfirmedCustomerTemplate,
  driverAssignedTemplate,
  bookingUpdatedDriverTemplate,
  driverAssignedCustomerTemplate,
} from '../templates/email-templates';
import { SimpleBooking, SimpleBookingDocument } from '../../bookings/schemas/simple-booking.schema';
import { SimpleDriver, SimpleDriverDocument } from '../../drivers/schemas/simple-driver.schema';

export interface BookingNotificationPayload {
  bookingId: string;
  driverId?: string;
  driverLink?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly adminEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
    @InjectModel(SimpleDriver.name) private driverModel: Model<SimpleDriverDocument>,
  ) {
    this.adminEmail = this.configService.get<string>('smtp.adminEmail') 
      || this.configService.get<string>('ADMIN_EMAIL')
      || 'admin@visitmauritiusparadise.com';
    this.frontendUrl = this.configService.get<string>('frontendUrl') 
      || 'https://visitmauritiusparadise.com';
  }

  /**
   * Get booking data formatted for email templates
   */
  private async getBookingEmailData(bookingId: string, driverLink?: string): Promise<BookingEmailData | null> {
    let booking: SimpleBookingDocument | null = null;

    // Try to find by bookingId
    booking = await this.bookingModel.findOne({ bookingId }).exec();

    // Try by MongoDB ObjectId
    if (!booking && Types.ObjectId.isValid(bookingId)) {
      booking = await this.bookingModel.findById(bookingId).exec();
    }

    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for notification`);
      return null;
    }

    // Build booking URL
    const bookingUrl = booking.accessCode 
      ? `${this.frontendUrl}/my-booking/${booking.accessCode}`
      : undefined;

    return {
      bookingId: booking.bookingId,
      bookingUrl,
      driverLink,
      passengerName: `${booking.passengerFirstName} ${booking.passengerLastName}`,
      passengerEmail: booking.passengerEmail,
      passengerPhone: booking.passengerPhone,
      originName: booking.originName || booking.originAddress || 'N/A',
      destinationName: booking.destinationName || booking.destinationAddress || 'N/A',
      pickupAt: formatDateTime(booking.pickupAt),
      flightNumber: booking.flightNumber,
      passengers: booking.passengers,
      luggage: booking.luggage,
      vehicleClass: booking.vehicleClass,
      vehicleName: booking.vehicleName,
      total: booking.total,
      currency: booking.currency,
      notes: booking.notes,
      signText: booking.signText,
    };
  }

  /**
   * Get driver info by ID
   */
  private async getDriverInfo(driverId: string): Promise<{
    name: string;
    email: string;
    phone: string;
  } | null> {
    let driver: SimpleDriverDocument | null = null;

    if (Types.ObjectId.isValid(driverId)) {
      driver = await this.driverModel.findById(driverId).exec();
    }

    if (!driver) {
      driver = await this.driverModel.findOne({ driverId }).exec();
    }

    if (!driver) {
      this.logger.warn(`Driver ${driverId} not found for notification`);
      return null;
    }

    return {
      name: `${driver.firstName} ${driver.lastName}`,
      email: driver.email,
      phone: driver.phone,
    };
  }

  /**
   * Send notification when booking is confirmed/paid
   * - Sends email to admin (new booking notification)
   * - Sends email to customer (booking confirmed)
   */
  async onBookingConfirmed(bookingId: string): Promise<void> {
    this.logger.log(`Sending booking confirmed notifications for ${bookingId}`);

    const bookingData = await this.getBookingEmailData(bookingId);
    if (!bookingData) {
      return;
    }

    // Send to admin
    const adminEmailSent = await this.emailService.sendEmail({
      to: this.adminEmail,
      subject: `🚗 New Booking: ${bookingData.bookingId} - ${bookingData.passengerName}`,
      html: newBookingAdminTemplate(bookingData),
    });

    if (adminEmailSent) {
      this.logger.log(`Admin notification sent for booking ${bookingId}`);
    }

    // Send to customer
    if (bookingData.passengerEmail) {
      const customerEmailSent = await this.emailService.sendEmail({
        to: bookingData.passengerEmail,
        subject: `✅ Booking Confirmed - ${bookingData.bookingId}`,
        html: bookingConfirmedCustomerTemplate(bookingData),
      });

      if (customerEmailSent) {
        this.logger.log(`Customer confirmation sent to ${bookingData.passengerEmail} for booking ${bookingId}`);
      }
    } else {
      this.logger.warn(`No customer email for booking ${bookingId}, skipping customer notification`);
    }
  }

  /**
   * Send notification when driver is assigned to booking
   * - Sends email to driver (new trip assignment)
   * - Sends email to customer (driver assigned notification)
   */
  async onDriverAssigned(bookingId: string, driverId: string, driverLink?: string): Promise<void> {
    this.logger.log(`Sending driver assigned notifications for booking ${bookingId}, driver ${driverId}`);

    const bookingData = await this.getBookingEmailData(bookingId, driverLink);
    if (!bookingData) {
      return;
    }

    const driverInfo = await this.getDriverInfo(driverId);
    if (!driverInfo) {
      this.logger.warn(`Driver ${driverId} not found, skipping driver notification`);
      return;
    }

    // Add driver info to booking data
    bookingData.driverName = driverInfo.name;
    bookingData.driverPhone = driverInfo.phone;
    bookingData.driverEmail = driverInfo.email;

    // Send to driver
    const driverEmailSent = await this.emailService.sendEmail({
      to: driverInfo.email,
      subject: `🚗 New Trip Assignment - ${bookingData.bookingId}`,
      html: driverAssignedTemplate(bookingData),
    });

    if (driverEmailSent) {
      this.logger.log(`Driver notification sent to ${driverInfo.email} for booking ${bookingId}`);
    }

    // Send driver assigned notification to customer
    if (bookingData.passengerEmail) {
      const customerEmailSent = await this.emailService.sendEmail({
        to: bookingData.passengerEmail,
        subject: `🚗 Driver Assigned - ${bookingData.bookingId}`,
        html: driverAssignedCustomerTemplate(bookingData),
      });

      if (customerEmailSent) {
        this.logger.log(`Driver assignment notification sent to customer ${bookingData.passengerEmail}`);
      }
    }
  }

  /**
   * Send notification when booking is updated
   * - Sends email to assigned driver (booking updated)
   */
  async onBookingUpdated(bookingId: string, driverId?: string, driverLink?: string): Promise<void> {
    this.logger.log(`Sending booking updated notification for ${bookingId}`);

    // If no driver ID provided, try to get from booking
    let actualDriverId = driverId;
    if (!actualDriverId) {
      const booking = await this.bookingModel.findOne({ bookingId }).exec();
      if (booking?.assignedDriver) {
        actualDriverId = booking.assignedDriver.toString();
      }
    }

    if (!actualDriverId) {
      this.logger.log(`No driver assigned to booking ${bookingId}, skipping update notification`);
      return;
    }

    const bookingData = await this.getBookingEmailData(bookingId, driverLink);
    if (!bookingData) {
      return;
    }

    const driverInfo = await this.getDriverInfo(actualDriverId);
    if (!driverInfo) {
      this.logger.warn(`Driver ${actualDriverId} not found, skipping update notification`);
      return;
    }

    // Send to driver
    const driverEmailSent = await this.emailService.sendEmail({
      to: driverInfo.email,
      subject: `⚠️ Booking Updated - ${bookingData.bookingId}`,
      html: bookingUpdatedDriverTemplate(bookingData),
    });

    if (driverEmailSent) {
      this.logger.log(`Booking update notification sent to driver ${driverInfo.email} for booking ${bookingId}`);
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.emailService.isConfigured();
  }
}

