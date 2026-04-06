import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PageDocument = Page & Document;

@Schema({ timestamps: true })
export class Page {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Object, default: {} })
  canvasData: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const PageSchema = SchemaFactory.createForClass(Page);
