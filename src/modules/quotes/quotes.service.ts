import { Injectable } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class QuotesService {
  create(dto: CreateQuoteDto) {
    const base = 30;
    const extras = (dto.extras?.length || 0) * 5;
    const total = base + extras;
    return {
      quoteId: randomUUID(),
      currency: 'USD',
      total,
      breakdown: { base, extras },
      classes: [
        { id: 'sedan', name: 'Sedan', paxCap: 3, bagCap: 2, total },
        { id: 'van', name: 'Van', paxCap: 6, bagCap: 6, total: Math.round(total * 1.6) },
      ],
      policy: {
        cancellation: 'Free until 24h before pickup',
        includedWait: '60 minutes after landing for arrivals',
      },
    };
  }
}
