import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  create(dto: CreateBookingDto) {
    const bookingId = randomUUID();
    return {
      bookingId,
      status: 'pending_payment',
      policySnapshot: {
        cancellation: 'Free until 24h before pickup',
        includedWait: '60 minutes after landing for arrivals',
      },
      confirmation: {
        message: 'Booking created, awaiting payment confirmation',
      },
    };
  }

  get(id: string) {
    return { id, status: 'confirmed' };
  }

  cancel(id: string) {
    return { id, status: 'cancelled_by_user', refund: { amount: 0, currency: 'USD' } };
  }
}
