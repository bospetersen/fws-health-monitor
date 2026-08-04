import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Endpoint extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 'custom' })
  type: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EndpointGroup' })
  groupId: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EndpointSchema = SchemaFactory.createForClass(Endpoint);
