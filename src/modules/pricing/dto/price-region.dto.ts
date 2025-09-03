import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean, IsEnum, ValidateNested, IsNumber, Min, Max, IsLatitude, IsLongitude } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RegionShapeType } from '../schemas/price-region.schema';

export class RegionShapeDto {
  @ApiProperty({ enum: RegionShapeType, description: 'Shape type: circle or polygon' })
  @IsEnum(RegionShapeType)
  type!: RegionShapeType;

  @ApiProperty({ 
    description: 'Center coordinates for circle [longitude, latitude]',
    example: [55.2708, 25.2048],
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => value?.map((coord: any) => parseFloat(coord)))
  center?: [number, number];

  @ApiProperty({ 
    description: 'Radius in meters for circle',
    example: 5000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  radius?: number;

  @ApiProperty({ 
    description: 'GeoJSON geometry for polygon',
    required: false
  })
  @IsOptional()
  geometry?: any;
}

export class CreatePriceRegionDto {
  @ApiProperty({ description: 'Region name', example: 'Dubai International Airport' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ 
    description: 'Region tags for categorization', 
    example: ['airport', 'dubai'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];

  @ApiProperty({ description: 'Region shape definition' })
  @ValidateNested()
  @Type(() => RegionShapeDto)
  shape!: RegionShapeDto;

  @ApiProperty({ description: 'Whether region is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({ description: 'Region description', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}

export class UpdatePriceRegionDto extends PartialType(CreatePriceRegionDto) {}

export class PriceRegionResponseDto {
  @ApiProperty({ description: 'Region ID' })
  _id!: string;

  @ApiProperty({ description: 'Region name' })
  name!: string;

  @ApiProperty({ description: 'Region tags' })
  tags!: string[];

  @ApiProperty({ description: 'Region shape' })
  shape!: RegionShapeDto;

  @ApiProperty({ description: 'Whether region is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Region description' })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export class PriceRegionListResponseDto {
  @ApiProperty({ type: [PriceRegionResponseDto] })
  data!: PriceRegionResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
