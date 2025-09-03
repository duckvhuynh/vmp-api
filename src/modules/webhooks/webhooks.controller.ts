import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  @Post('payments')
  @ApiBody({ description: 'Stripe event payload', schema: { example: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_...', amount: 3500 } } } } })
  @ApiOkResponse({ description: 'Acknowledged', schema: { example: { received: true } } })
  payments(@Body() payload: any, @Headers('stripe-signature') signature?: string) {
    // TODO: verify signature
    return { received: true };
  }

  @Post('flight-updates')
  @ApiBody({ description: 'Flight update payload', schema: { example: { flightNumber: 'MK015', status: 'DELAYED', estimated: '2025-09-04T11:30:00Z' } } })
  @ApiOkResponse({ description: 'Acknowledged', schema: { example: { received: true } } })
  flight(@Body() payload: any) {
    return { received: true };
  }

  @Post('sms-status')
  @ApiBody({ description: 'SMS status callback', schema: { example: { messageId: 'abc', status: 'delivered' } } })
  @ApiOkResponse({ description: 'Acknowledged', schema: { example: { received: true } } })
  sms(@Body() payload: any) {
    return { received: true };
  }
}
