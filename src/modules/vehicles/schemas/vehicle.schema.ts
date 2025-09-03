import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

@Schema()
export class Translation {
  @Prop({ type: String })
  en!: string;

  @Prop({ type: String })
  cn!: string;

  @Prop({ type: String })
  vi!: string;
}

@Schema()
export class TranslationField {
  @Prop({ type: Translation, required: true, _id: false })
  translations!: Translation;

  @Prop({ required: true })
  value!: string;

  @Prop({ required: true, enum: ['en', 'cn', 'vi'] })
  defaultLanguage!: string;
}

@Schema()
export class CapacitySpecs {
  @Prop({ required: true, min: 1 })
  maxPassengers!: number;

  @Prop({ required: true, min: 0 })
  maxLuggage!: number;

  @Prop({ required: false, min: 0 })
  maxWeight?: number; // in kg
}

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ type: TranslationField, required: true, _id: false })
  name!: TranslationField;

  @Prop({ type: TranslationField, required: true, _id: false })
  equivalent!: TranslationField;

  @Prop({ 
    required: true, 
    enum: ['sedan', 'suv', 'van', 'luxury', 'minibus', 'coach', 'motorcycle'] 
  })
  vehicleType!: string;

  @Prop({ 
    required: true, 
    enum: ['economy', 'standard', 'premium', 'luxury', 'business'] 
  })
  category!: string;

  @Prop({ required: false })
  image?: string; // URL to vehicle image

  @Prop({ type: CapacitySpecs, required: true, _id: false })
  capacity!: CapacitySpecs;

  @Prop({ required: true, default: false })
  isElectric!: boolean;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false, min: 0 })
  baseRatePerKm?: number; // Optional base rate for this vehicle type

  @Prop({ required: false })
  licensePlate?: string;

  @Prop({ required: false })
  model?: string;

  @Prop({ required: false })
  brand?: string;

  @Prop({ required: false, min: 1900, max: new Date().getFullYear() + 1 })
  year?: number;

  @Prop({ required: false })
  color?: string;

  @Prop({ required: false })
  features?: string[]; // Array of features like "GPS", "AC", "WiFi", etc.
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
export const TranslationFieldSchema = SchemaFactory.createForClass(TranslationField);
export const TranslationSchema = SchemaFactory.createForClass(Translation);
export const CapacitySpecsSchema = SchemaFactory.createForClass(CapacitySpecs);

// Create indexes for better query performance
VehicleSchema.index({ vehicleType: 1 });
VehicleSchema.index({ category: 1 });
VehicleSchema.index({ isActive: 1 });
VehicleSchema.index({ isElectric: 1 });
VehicleSchema.index({ 'capacity.maxPassengers': 1 });
