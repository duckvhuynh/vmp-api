import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty({
    description: 'Filename with extension',
    example: 'profile-image.png',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'Filename can only contain letters, numbers, underscores, hyphens, and dots',
  })
  filename!: string;

  @ApiPropertyOptional({
    description: 'Folder/prefix path',
    example: 'users/avatars',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_\-\/]+$/, {
    message: 'Folder path can only contain letters, numbers, underscores, hyphens, and slashes',
  })
  folder?: string;

  @ApiPropertyOptional({
    description: 'Content type of the file',
    example: 'image/png',
  })
  @IsOptional()
  @IsString()
  contentType?: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading the file directly to MinIO/S3',
    example: 'https://storage.visitmauritiusparadise.com/vmp/users/avatars/profile-image.png?X-Amz-Algorithm=...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'Public URL of the file after upload',
    example: 'https://storage.visitmauritiusparadise.com/vmp/users/avatars/profile-image.png',
  })
  fileUrl!: string;

  @ApiProperty({
    description: 'Object key/path in the bucket',
    example: 'users/avatars/profile-image.png',
  })
  key!: string;

  @ApiProperty({
    description: 'Bucket name',
    example: 'vmp',
  })
  bucket!: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 300,
  })
  expiresIn!: number;
}

export class DeleteFileDto {
  @ApiProperty({
    description: 'Object key/path in the bucket',
    example: 'users/avatars/profile-image.png',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;
}

export class DeleteFileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File deleted successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Deleted object key',
    example: 'users/avatars/profile-image.png',
  })
  key!: string;
}

