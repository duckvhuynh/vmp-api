import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import {
  GetPresignedUrlDto,
  PresignedUrlResponseDto,
  DeleteFileResponseDto,
} from './dto/upload.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly useSSL: boolean;

  constructor(
    @Optional() @Inject('MINIO_CLIENT') private readonly minioClient: Client | null,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('minio.bucket') || 'vmp';
    this.endpoint = this.configService.get<string>('minio.endpoint') || '';
    this.useSSL = this.configService.get<boolean>('minio.useSSL') ?? true;
  }

  /**
   * Check if MinIO is configured and available
   */
  isAvailable(): boolean {
    return this.minioClient !== null;
  }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucket(): Promise<void> {
    if (!this.minioClient) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, '');
        this.logger.log(`Created bucket: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure bucket exists: ${error}`);
      throw new InternalServerErrorException('Failed to initialize storage');
    }
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getPresignedUploadUrl(dto: GetPresignedUrlDto): Promise<PresignedUrlResponseDto> {
    if (!this.minioClient) {
      throw new BadRequestException('File upload is not configured');
    }

    await this.ensureBucket();

    // Validate file extension
    const allowedExtensions = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
      // Videos
      '.mp4', '.webm', '.mov', '.avi',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
      // Archives
      '.zip', '.rar', '.7z',
    ];

    const ext = this.getFileExtension(dto.filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`File type ${ext} is not allowed`);
    }

    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    const sanitizedFilename = this.sanitizeFilename(dto.filename);
    const uniqueFilename = `${timestamp}-${uuid}-${sanitizedFilename}`;

    // Build the object key (path in bucket)
    const key = dto.folder 
      ? `${dto.folder.replace(/^\/|\/$/g, '')}/${uniqueFilename}`
      : uniqueFilename;

    try {
      // Generate presigned URL (expires in 5 minutes)
      const expiresIn = 60 * 5; // 5 minutes
      const uploadUrl = await this.minioClient.presignedPutObject(
        this.bucket,
        key,
        expiresIn,
      );

      // Build the public file URL
      const protocol = this.useSSL ? 'https' : 'http';
      const fileUrl = `${protocol}://${this.endpoint}/${this.bucket}/${key}`;

      this.logger.log(`Generated presigned URL for: ${key}`);

      return {
        uploadUrl,
        fileUrl,
        key,
        bucket: this.bucket,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error}`);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.minioClient) {
      throw new BadRequestException('File storage is not configured');
    }

    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucket,
        key,
        expiresIn,
      );
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error}`);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<DeleteFileResponseDto> {
    if (!this.minioClient) {
      throw new BadRequestException('File storage is not configured');
    }

    try {
      await this.minioClient.removeObject(this.bucket, key);
      this.logger.log(`Deleted file: ${key}`);

      return {
        message: 'File deleted successfully',
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.minioClient) {
      return false;
    }

    try {
      await this.minioClient.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix: string = '', maxKeys: number = 100): Promise<string[]> {
    if (!this.minioClient) {
      throw new BadRequestException('File storage is not configured');
    }

    const files: string[] = [];
    const stream = this.minioClient.listObjects(this.bucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name && files.length < maxKeys) {
          files.push(obj.name);
        }
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and other special characters
    return filename
      .replace(/[\/\\]/g, '')
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .toLowerCase();
  }
}

