import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { HealthModule } from './modules/health/health.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { SeedModule } from './modules/seed/seed.module';
import { MinioModule } from './modules/minio/minio.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('mongodbUri') || 'mongodb://localhost:27017/vmp';
        // eslint-disable-next-line no-console
        console.log('Connecting to MongoDB:', uri.replace(/:[^:@]+@/, ':****@'));
        return {
          uri,
          retryWrites: true,
          retryReads: true,
          // Increase timeout to allow MongoDB to start (especially in docker-compose)
          serverSelectionTimeoutMS: 30000, // 30 seconds
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000, // 30 seconds
          // Retry connection attempts
          maxPoolSize: 10,
          minPoolSize: 2,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    HealthModule,
    QuotesModule,
    BookingsModule,
    PaymentsModule,
    WebhooksModule,
    DriversModule,
    DispatchModule,
    AdminModule,
    AuthModule,
    PricingModule,
    VehiclesModule,
    SeedModule,
    MinioModule,
    UploadModule,
    ReportsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
