import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { AISettings, AISettingsDocument } from '../../models/ai-settings.schema';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32';
const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectModel(AISettings.name) private aiSettingsModel: Model<AISettingsDocument>,
  ) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async getSettings(userId: string) {
    const settings = await this.aiSettingsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!settings) {
      return {
        provider: 'openai',
        hasApiKey: false,
      };
    }

    return {
      provider: settings.provider,
      hasApiKey: true,
    };
  }

  async updateSettings(
    userId: string,
    data: { provider: string; apiKey: string },
  ) {
    const encryptedKey = this.encrypt(data.apiKey);

    const settings = await this.aiSettingsModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        provider: data.provider,
        encryptedApiKey: encryptedKey,
      },
      { new: true, upsert: true },
    );

    return {
      provider: settings.provider,
      hasApiKey: true,
    };
  }

  async getApiKey(userId: string): Promise<string | null> {
    const settings = await this.aiSettingsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!settings) {
      return null;
    }

    return this.decrypt(settings.encryptedApiKey);
  }
}
