import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiSettingsService } from './ai-settings.service';
import { AISettings, AISettingsSchema } from '../../models/ai-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AISettings.name, schema: AISettingsSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, AiSettingsService],
  exports: [AiService, AiSettingsService],
})
export class AiModule {}
