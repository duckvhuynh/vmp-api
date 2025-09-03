import { Body, Controller, Post } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuoteResponseDto } from './dto/create-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Quote created', type: QuoteResponseDto })
  create(@Body() dto: CreateQuoteDto) {
    return this.service.create(dto);
  }
}
