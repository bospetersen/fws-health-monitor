import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class HealthCheckResult extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Endpoint', required: true })
  endpointId: Types.ObjectId;

  @Prop({ required: true })
  endpointName: string;

  @Prop({ required: true })
  url: string;

  @Prop({ enum: ['online', 'offline'], required: true })
  status: 'online' | 'offline';

  @Prop({ type: Number, default: null })
  responseTime: number;

  @Prop({ type: Number, default: null })
  statusCode: number;

  @Prop({ type: String, default: null })
  errorMessage: string;

  @Prop({ type: String, default: null })
  stackTrace: string;

  @Prop({ default: Date.now })
  checkedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const HealthCheckResultSchema = SchemaFactory.createForClass(HealthCheckResult);
