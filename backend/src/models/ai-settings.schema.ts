import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AISettingsDocument = AISettings & Document;

@Schema({ timestamps: true })
export class AISettings {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 'openai' })
  provider: 'openai' | 'anthropic' | 'gemini';

  @Prop({ required: true })
  encryptedApiKey: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AISettingsSchema = SchemaFactory.createForClass(AISettings);
