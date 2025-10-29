import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuoteDocument = Quote & Document;

@Schema({ timestamps: true })
export class Quote {
  @Prop({ required: true, unique: true, index: true })
  quoteId!: string;

  @Prop({ required: true })
  pickupAt!: Date;

  @Prop({ required: true, min: 1 })
  passengers!: number;

  @Prop({ required: true, min: 0 })
  luggage!: number;

  @Prop({ type: [String], default: [] })
  extras!: string[];

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ default: false })
  isUsed!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
