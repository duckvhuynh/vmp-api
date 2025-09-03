import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class PriceRegionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];
}

export class BasePriceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by region ID' })
  @IsOptional()
  @IsMongoId()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle class' })
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiPropertyOptional({ description: 'Filter by currency' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;
}

export class SurchargeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by region ID' })
  @IsOptional()
  @IsMongoId()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Filter by surcharge type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class FixedPriceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by origin region ID' })
  @IsOptional()
  @IsMongoId()
  originRegionId?: string;

  @ApiPropertyOptional({ description: 'Filter by destination region ID' })
  @IsOptional()
  @IsMongoId()
  destinationRegionId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle class' })
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiPropertyOptional({ description: 'Filter by currency' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];
}
