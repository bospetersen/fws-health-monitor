import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CheckInterval extends Document {
  @Prop({ required: true, default: 300000 })
  interval: number;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ default: Date.now })
  setAt: Date;

  @Prop({ type: String, default: 'system' })
  setBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CheckIntervalSchema = SchemaFactory.createForClass(CheckInterval);
