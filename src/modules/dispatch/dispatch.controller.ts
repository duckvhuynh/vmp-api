import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dispatch')
@Controller('dispatch')
export class DispatchController {
  @Post('assign')
  assign(@Body() body: { bookingId: string; driverId: string }) {
    return { status: 'assigned', ...body };
  }

  @Post('reassign')
  reassign(@Body() body: { bookingId: string; driverId: string }) {
    return { status: 'reassigned', ...body };
  }
}
