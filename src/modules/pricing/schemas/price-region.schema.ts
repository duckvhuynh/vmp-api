import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PriceRegionDocument = PriceRegion & Document;

export enum RegionShapeType {
  CIRCLE = 'circle',
  POLYGON = 'polygon'
}

@Schema({ _id: false })
export class RegionShape {
  @ApiProperty({ enum: RegionShapeType, description: 'Shape type: circle or polygon' })
  @Prop({ type: String, enum: RegionShapeType, required: true })
  type!: RegionShapeType;

  @ApiProperty({ 
    description: 'Center coordinates for circle [longitude, latitude]',
    example: [55.2708, 25.2048]
  })
  @Prop({ type: [Number] })
  center?: [number, number];

  @ApiProperty({ 
    description: 'Radius in meters for circle',
    example: 5000
  })
  @Prop({ type: Number })
  radius?: number;

  @ApiProperty({ 
    description: 'GeoJSON geometry for polygon'
  })
  @Prop({ type: Object })
  geometry?: any; // GeoJSON geometry object
}

const RegionShapeSchema = SchemaFactory.createForClass(RegionShape);

@Schema({ timestamps: true })
export class PriceRegion {
  @ApiProperty({ description: 'Unique identifier' })
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Region name', example: 'Dubai International Airport' })
  @Prop({ required: true, trim: true })
  name!: string;

  @ApiProperty({ description: 'Region tags for categorization', example: ['airport', 'dubai'] })
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @ApiProperty({ description: 'Region shape definition' })
  @Prop({ type: RegionShapeSchema, required: true })
  shape!: RegionShape;

  @ApiProperty({ description: 'Whether region is active', default: true })
  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Region description' })
  @Prop({ type: String })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export const PriceRegionSchema = SchemaFactory.createForClass(PriceRegion);

// Create geospatial index for efficient location queries
PriceRegionSchema.index({ 'shape.center': '2dsphere' });
PriceRegionSchema.index({ 'shape.geometry': '2dsphere' });
