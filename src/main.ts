import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  try {
    // eslint-disable-next-line no-console
    console.log('Starting NestJS application...');
    // eslint-disable-next-line no-console
    console.log('Environment:', process.env.NODE_ENV);
    // eslint-disable-next-line no-console
    console.log('Port:', process.env.PORT || '3000');
    // eslint-disable-next-line no-console
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'Not set');
    // eslint-disable-next-line no-console
    console.log('Redis Host:', process.env.REDIS_HOST || 'Not set');

    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Security middleware
    app.use(helmet());
    app.use(compression());
    app.enableCors({ origin: true, credentials: true });

    // Global prefix
    app.setGlobalPrefix('api/v1', { exclude: ['docs', 'docs-json', 'health'] });

    // Global pipes for validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: false,
        forbidNonWhitelisted: true,
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global response transformer (optional - can be disabled if raw responses are preferred)
    // app.useGlobalInterceptors(new TransformInterceptor());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('VMP API')
      .setDescription('Airport Taxi Booking System API — Swagger Docs')
      .setVersion('0.1.0')
      .setContact('Airport Mobility', 'https://example.com', 'support@example.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Local (container default)')
      .addServer('http://localhost:3001', 'Local (host mapped via compose)')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
      customSiteTitle: 'VMP API Docs',
    });

    const port = parseInt(process.env.PORT || '3000', 10);
    // eslint-disable-next-line no-console
    console.log(`Attempting to listen on 0.0.0.0:${port}...`);
    await app.listen(port, '0.0.0.0');
    // eslint-disable-next-line no-console
    console.log(`✅ API running on http://0.0.0.0:${port}`);
    // eslint-disable-next-line no-console
    console.log(`✅ Health check available at http://0.0.0.0:${port}/health`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start application:', error);
    // eslint-disable-next-line no-console
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Bootstrap failed:', error);
  // eslint-disable-next-line no-console
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  process.exit(1);
});
