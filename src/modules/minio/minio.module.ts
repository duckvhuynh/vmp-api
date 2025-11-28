import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Global()
@Module({
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory: (configService: ConfigService) => {
        const endpoint = configService.get<string>('minio.endpoint');
        const port = configService.get<number>('minio.port');
        const useSSL = configService.get<boolean>('minio.useSSL');
        const accessKey = configService.get<string>('minio.accessKey');
        const secretKey = configService.get<string>('minio.secretKey');

        if (!endpoint || !accessKey || !secretKey) {
          console.warn('MinIO configuration incomplete - MinIO features will be disabled');
          return null;
        }

        return new Client({
          endPoint: endpoint,
          port: port || 443,
          useSSL: useSSL ?? true,
          accessKey,
          secretKey,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['MINIO_CLIENT'],
})
export class MinioModule {}

