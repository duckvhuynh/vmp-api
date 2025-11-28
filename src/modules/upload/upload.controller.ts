import {
  Controller,
  Get,
  Delete,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UploadService } from './upload.service';
import {
  GetPresignedUrlDto,
  PresignedUrlResponseDto,
  DeleteFileDto,
  DeleteFileResponseDto,
} from './dto/upload.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('presigned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned upload URL',
    description: `
      Generate a presigned URL for uploading a file directly to MinIO/S3 storage.
      
      **Flow:**
      1. Call this endpoint with filename (and optional folder)
      2. Receive uploadUrl and fileUrl
      3. Use uploadUrl to PUT the file directly to storage
      4. After successful upload, the file is accessible at fileUrl
      
      **Supported file types:**
      - Images: jpg, jpeg, png, gif, webp, svg, ico
      - Videos: mp4, webm, mov, avi
      - Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv
      - Archives: zip, rar, 7z
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid filename or file type not allowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Storage service error' })
  async getPresignedUploadUrl(
    @Query() dto: GetPresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.uploadService.getPresignedUploadUrl(dto);
  }

  @Get('download-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned download URL',
    description: 'Generate a presigned URL for downloading/viewing a private file',
  })
  @ApiQuery({ name: 'key', description: 'Object key/path in the bucket' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration in seconds (default: 3600)' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid key' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPresignedDownloadUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const downloadUrl = await this.uploadService.getPresignedDownloadUrl(
      key,
      expiresIn || 3600,
    );
    return {
      downloadUrl,
      expiresIn: expiresIn || 3600,
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file from storage by its key/path',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    type: DeleteFileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid key or storage not configured' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(@Body() dto: DeleteFileDto): Promise<DeleteFileResponseDto> {
    return this.uploadService.deleteFile(dto.key);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check upload service status',
    description: 'Check if the file upload/storage service is available',
  })
  @ApiResponse({
    status: 200,
    description: 'Service status',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getStatus() {
    const available = this.uploadService.isAvailable();
    return {
      available,
      message: available
        ? 'File upload service is available'
        : 'File upload service is not configured',
    };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List files in a folder',
    description: 'List files in storage with optional prefix filter',
  })
  @ApiQuery({ name: 'prefix', required: false, description: 'Folder/prefix to filter by' })
  @ApiQuery({ name: 'maxKeys', required: false, description: 'Maximum number of files to return (default: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Files listed successfully',
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        count: { type: 'number' },
      },
    },
  })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: number,
  ) {
    const files = await this.uploadService.listFiles(prefix || '', maxKeys || 100);
    return {
      files,
      count: files.length,
    };
  }
}

