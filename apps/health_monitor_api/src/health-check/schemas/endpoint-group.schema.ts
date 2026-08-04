import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class EndpointGroup extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

export const EndpointGroupSchema = SchemaFactory.createForClass(EndpointGroup);
