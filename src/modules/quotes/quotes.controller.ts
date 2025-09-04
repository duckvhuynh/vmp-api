import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, QuoteResponseDto } from './dto/create-quote.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new quote',
    description: 'Calculate pricing for a trip based on origin, destination, and preferences. Supports fixed route pricing and distance-based pricing with dynamic surcharges.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Quote created successfully with pricing for all available vehicle classes',
    type: QuoteResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data or location not covered by price regions' 
  })
  create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return this.service.create(dto);
  }

  @Get(':quoteId')
  @ApiOperation({ 
    summary: 'Retrieve an existing quote',
    description: 'Get quote details by ID. Returns error if quote has expired.'
  })
  @ApiParam({ 
    name: 'quoteId', 
    description: 'Unique quote identifier',
    example: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Quote retrieved successfully',
    type: QuoteResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Quote not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Quote has expired' 
  })
  findOne(@Param('quoteId') quoteId: string): Promise<QuoteResponseDto> {
    return this.service.findOne(quoteId);
  }
}
