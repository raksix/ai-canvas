import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface ExcalidrawElement {
  id: string;
  type: string;
  [key: string]: any;
}

@Injectable()
export class CanvasService {
  constructor(@InjectConnection() private connection: Connection) {}

  async saveScene(
    projectId: string,
    pageId: string,
    elements: ExcalidrawElement[],
  ): Promise<void> {
    const scenes = this.connection.collection('scenes');

    const filter = { pageId };
    const update = {
      $set: {
        projectId,
        elements,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };
    const options = { upsert: true };

    await scenes.updateOne(filter, update, options);
  }

  async getScene(projectId: string, pageId: string): Promise<ExcalidrawElement[]> {
    const scenes = this.connection.collection('scenes');
    const scene = await scenes.findOne({ pageId });
    return scene?.elements || [];
  }

  async deleteScene(projectId: string, pageId: string): Promise<void> {
    const scenes = this.connection.collection('scenes');
    await scenes.deleteOne({ pageId });
  }
}
