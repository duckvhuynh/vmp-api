import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

class PaymentIntentDto {
  amount!: number;
  currency!: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  @Post('intent')
  @ApiOkResponse({ description: 'Payment intent created', schema: { example: { clientSecret: 'pi_test_client_secret', amount: 3500, currency: 'USD' } } })
  createIntent(@Body() body: PaymentIntentDto) {
    return { clientSecret: 'pi_test_client_secret', amount: body.amount, currency: body.currency };
  }
}
