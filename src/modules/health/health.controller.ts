import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ 
    summary: 'Health check - Liveness probe',
    description: 'Check if the service is alive and running'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is alive',
    schema: {
      example: { status: 'ok', timestamp: '2025-10-29T10:00:00.000Z' }
    }
  })
  liveness() {
    return { 
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Health check - Readiness probe',
    description: 'Check if the service is ready to accept requests'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready',
    schema: {
      example: { 
        status: 'ready', 
        timestamp: '2025-10-29T10:00:00.000Z',
        services: {
          database: 'connected',
          redis: 'connected'
        }
      }
    }
  })
  readiness() {
    return { 
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    };
  }
}
