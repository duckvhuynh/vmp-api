import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Drivers')
@Controller('drivers/me')
export class DriversController {
  @Get('jobs')
  jobs() {
    return { jobs: [] };
  }
}
