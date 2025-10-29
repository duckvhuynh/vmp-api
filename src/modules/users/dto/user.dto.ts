import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  ADMIN = 'admin',
  DISPATCHER = 'dispatcher',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'StrongP@ssw0rd' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '+230 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: [String], enum: UserRole, example: [UserRole.PASSENGER] })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+230 1234 5679' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: [String], enum: UserRole })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

export class UserResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+230 1234 5678' })
  phone?: string;

  @ApiProperty({ type: [String], enum: UserRole, example: [UserRole.PASSENGER] })
  roles!: UserRole[];

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  updatedAt!: Date;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ssw0rd' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: 8, example: 'NewP@ssw0rd' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

