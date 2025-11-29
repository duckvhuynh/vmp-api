import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  CreateCheckoutDto,
  CheckoutResponseDto,
  CheckoutDetailsDto,
  FiservWebhookPayloadDto,
  FiservTransactionStatus,
  FiservTransactionType,
  FiservPaymentMethod,
} from '../dto/fiserv-checkout.dto';
import { SimpleBooking, SimpleBookingDocument, BookingStatus, BookingEventName } from '../../bookings/schemas/simple-booking.schema';

export interface FiservConfig {
  baseUrl: string;
  storeId: string;
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  defaultSuccessUrl: string;
  defaultFailureUrl: string;
}

@Injectable()
export class FiservService {
  private readonly logger = new Logger(FiservService.name);
  private readonly client: AxiosInstance;
  private readonly config: FiservConfig;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SimpleBooking.name) private bookingModel: Model<SimpleBookingDocument>,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('fiserv.baseUrl') || 'https://api.checkout-lane.com/v1',
      storeId: this.configService.get<string>('fiserv.storeId') || '',
      apiKey: this.configService.get<string>('fiserv.apiKey') || '',
      secretKey: this.configService.get<string>('fiserv.secretKey') || '',
      webhookUrl: this.configService.get<string>('fiserv.webhookUrl') || '',
      defaultSuccessUrl: this.configService.get<string>('fiserv.defaultSuccessUrl') || 'https://visitmauritiusparadise.com/booking/success',
      defaultFailureUrl: this.configService.get<string>('fiserv.defaultFailureUrl') || 'https://visitmauritiusparadise.com/booking/failed',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.config.apiKey,
      },
      timeout: 30000,
    });
  }

  /**
   * Check if Fiserv is configured
   */
  isConfigured(): boolean {
    return !!(this.config.storeId && this.config.apiKey && this.config.secretKey);
  }

  /**
   * Create a checkout session with Fiserv
   * Reference: https://docs.fiserv.dev/public/reference/checkouts
   */
  async createCheckout(dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Fiserv payment gateway is not configured');
    }

    // Find the booking
    const booking = await this.findBooking(dto.bookingId);

    // Generate merchant transaction ID if not provided
    const merchantTransactionId = dto.merchantTransactionId || 
      `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${booking.bookingId}`;

    // Build the checkout request payload
    const payload = {
      storeId: this.config.storeId,
      merchantTransactionId,
      transactionType: FiservTransactionType.SALE,
      transactionAmount: {
        total: dto.total,
        currency: dto.currency || 'MUR',
      },
      billing: dto.customerName || dto.customerEmail ? {
        name: dto.customerName,
        email: dto.customerEmail,
      } : undefined,
      checkoutSettings: {
        locale: dto.locale || 'en_GB',
        preSelectedPaymentMethod: dto.paymentMethod || FiservPaymentMethod.CARDS,
        webHooksUrl: this.config.webhookUrl,
        redirectBackUrls: {
          successUrl: dto.successUrl || `${this.config.defaultSuccessUrl}?bookingId=${booking.bookingId}`,
          failureUrl: dto.failureUrl || `${this.config.defaultFailureUrl}?bookingId=${booking.bookingId}`,
        },
      },
      additionalDetails: {
        comments: dto.description || `Payment for booking ${booking.bookingId}`,
      },
    };

    this.logger.log(`Creating Fiserv checkout for booking ${booking.bookingId}`);
    this.logger.debug(`Fiserv base URL: ${this.config.baseUrl}`);
    this.logger.debug(`Fiserv payload: ${JSON.stringify(payload)}`);

    try {
      const headers = this.generateRequestHeaders(payload);
      this.logger.debug(`Fiserv headers: ${JSON.stringify(headers)}`);

      const response = await this.client.post('/checkouts', payload, { headers });

      const checkout = response.data.checkout || response.data;

      // Update booking with payment intent
      booking.paymentIntentId = checkout.checkoutId;
      booking.updatedAt = new Date();
      booking.events.push({
        event: 'payment_initiated',
        status: booking.status,
        timestamp: new Date(),
        description: `Payment checkout created: ${checkout.checkoutId}`,
      });
      await booking.save();

      this.logger.log(`Checkout created: ${checkout.checkoutId} for booking ${booking.bookingId}`);

      return {
        checkoutId: checkout.checkoutId,
        redirectionUrl: checkout.redirectionUrl,
        bookingId: booking.bookingId,
        merchantTransactionId,
        amount: dto.total,
        currency: dto.currency || 'MUR',
        status: 'WAITING',
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // Log detailed error from Fiserv
      this.logger.error(`Failed to create checkout: ${error.message}`);
      this.logger.error(`Fiserv error response: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`Fiserv error status: ${error.response?.status}`);
      
      // Extract meaningful error message
      const fiservError = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || error.response?.data?.errors?.[0]?.message
        || error.message;
      
      throw new InternalServerErrorException(
        `Failed to create payment checkout: ${fiservError}`
      );
    }
  }

  /**
   * Get checkout details from Fiserv
   * Reference: https://docs.fiserv.dev/public/reference/get-checkouts-id
   */
  async getCheckout(checkoutId: string): Promise<CheckoutDetailsDto> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Fiserv payment gateway is not configured');
    }

    try {
      const response = await this.client.get(`/checkouts/${checkoutId}`, {
        headers: {
          'Api-Key': this.config.apiKey,
        },
      });

      const data = response.data;

      return {
        checkoutId: data.checkoutId || checkoutId,
        storeId: data.storeId,
        merchantTransactionId: data.merchantTransactionId,
        transactionType: data.transactionType,
        amount: data.approvedAmount?.total || data.transactionAmount?.total,
        currency: data.approvedAmount?.currency || data.transactionAmount?.currency,
        transactionStatus: data.transactionStatus,
        approvalCode: data.ipgTransactionDetails?.approvalCode,
        ipgTransactionId: data.ipgTransactionDetails?.ipgTransactionId,
        paymentMethodUsed: data.paymentMethodUsed,
        createdAt: data.createdAt || new Date().toISOString(),
        completedAt: data.completedAt,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get checkout: ${error.message}`, error.response?.data);
      throw new InternalServerErrorException(
        `Failed to retrieve checkout details: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Handle webhook from Fiserv
   */
  async handleWebhook(
    payload: FiservWebhookPayloadDto,
    signature?: string,
  ): Promise<{ success: boolean; bookingId?: string; message: string }> {
    this.logger.log(`Received Fiserv webhook: ${payload.checkoutId}, status: ${payload.transactionStatus}`);

    // Verify signature if provided
    if (signature && !this.verifySignature(payload, signature)) {
      this.logger.warn(`Invalid webhook signature for checkout ${payload.checkoutId}`);
      return { success: false, message: 'Invalid signature' };
    }

    try {
      // Find booking by payment intent ID (checkoutId)
      const booking = await this.bookingModel.findOne({
        paymentIntentId: payload.checkoutId,
      }).exec();

      if (!booking) {
        // Try to find by merchant transaction ID
        const merchantId = payload.merchantTransactionId;
        if (merchantId) {
          const bookingId = merchantId.split('-').pop(); // Extract booking ID from TXN-DATE-BOOKINGID
          const bookingByTxn = await this.bookingModel.findOne({
            bookingId: { $regex: bookingId, $options: 'i' },
          }).exec();

          if (!bookingByTxn) {
            this.logger.warn(`Booking not found for checkout ${payload.checkoutId}`);
            return { success: false, message: 'Booking not found' };
          }
        } else {
          return { success: false, message: 'Booking not found' };
        }
      }

      const bookingToUpdate = booking!;

      // Update booking based on transaction status
      switch (payload.transactionStatus) {
        case FiservTransactionStatus.APPROVED:
          bookingToUpdate.status = BookingStatus.CONFIRMED;
          bookingToUpdate.paymentConfirmedAt = new Date();
          bookingToUpdate.events.push({
            event: BookingEventName.PAYMENT_SUCCESS,
            status: BookingStatus.CONFIRMED,
            timestamp: new Date(),
            description: `Payment approved. Amount: ${payload.approvedAmount.total} ${payload.approvedAmount.currency}`,
          });
          this.logger.log(`Payment approved for booking ${bookingToUpdate.bookingId}`);
          break;

        case FiservTransactionStatus.DECLINED:
        case FiservTransactionStatus.FAILED:
          bookingToUpdate.status = BookingStatus.PAYMENT_FAILED;
          bookingToUpdate.events.push({
            event: BookingEventName.PAYMENT_FAILED,
            status: BookingStatus.PAYMENT_FAILED,
            timestamp: new Date(),
            description: `Payment ${payload.transactionStatus.toLowerCase()}`,
          });
          this.logger.log(`Payment failed for booking ${bookingToUpdate.bookingId}`);
          break;

        case FiservTransactionStatus.WAITING:
          // Payment still processing
          bookingToUpdate.events.push({
            event: 'payment_processing',
            status: bookingToUpdate.status,
            timestamp: new Date(),
            description: 'Payment is being processed',
          });
          break;

        default:
          this.logger.warn(`Unknown transaction status: ${payload.transactionStatus}`);
      }

      bookingToUpdate.updatedAt = new Date();
      await bookingToUpdate.save();

      return {
        success: true,
        bookingId: bookingToUpdate.bookingId,
        message: `Webhook processed: ${payload.transactionStatus}`,
      };
    } catch (error: any) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify webhook signature using HMAC SHA256
   */
  verifySignature(payload: any, signature: string): boolean {
    try {
      const computed = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      return computed === signature;
    } catch (error) {
      this.logger.error('Error verifying signature');
      return false;
    }
  }

  /**
   * Generate request headers including HMAC authentication
   * Reference: https://docs.fiserv.dev/public/docs/generate-an-authentication-header
   */
  private generateRequestHeaders(payload: any): Record<string, string> {
    const timestamp = Date.now().toString();
    
    // Client-Request-Id must be UUID v4 format (128-bit)
    const clientRequestId = crypto.randomUUID();
    
    // Stringify payload for signature
    const rawPayload = JSON.stringify(payload);
    
    // Generate HMAC signature
    // Format: Api-Key + Client-Request-Id + Timestamp + Payload
    const messageToSign = this.config.apiKey + clientRequestId + timestamp + rawPayload;
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(messageToSign)
      .digest('base64');

    return {
      'Content-Type': 'application/json',
      'Api-Key': this.config.apiKey,
      'Client-Request-Id': clientRequestId,
      'Timestamp': timestamp,
      'Message-Signature': signature,
    };
  }

  /**
   * Find booking by ID
   */
  private async findBooking(bookingId: string): Promise<SimpleBookingDocument> {
    let booking: SimpleBookingDocument | null = null;

    // Try MongoDB ObjectId
    if (Types.ObjectId.isValid(bookingId)) {
      booking = await this.bookingModel.findById(bookingId).exec();
    }

    // Try by bookingId field
    if (!booking) {
      booking = await this.bookingModel.findOne({ bookingId }).exec();
    }

    if (!booking) {
      throw new BadRequestException(`Booking ${bookingId} not found`);
    }

    return booking;
  }
}

