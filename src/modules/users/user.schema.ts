import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: [] })
  roles!: Array<'passenger' | 'driver' | 'admin' | 'dispatcher'>;

  @Prop()
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
