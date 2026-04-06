import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../../models/project.schema';
import { Page, PageDocument } from '../../models/page.schema';

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
  ) {}

  private async checkProjectAccess(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async findAll(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    const pages = await this.pageModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ order: 1 });

    return pages.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      order: p.order,
      canvasData: p.canvasData,
      projectId: p.projectId.toString(),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async findById(id: string, userId: string) {
    const page = await this.pageModel.findById(id).populate('projectId');

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const project = await this.projectModel.findById(page.projectId);
    if (!project || project.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: page._id.toString(),
      name: page.name,
      order: page.order,
      canvasData: page.canvasData,
      projectId: page.projectId.toString(),
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  async create(projectId: string, userId: string, data: { name: string }) {
    await this.checkProjectAccess(projectId, userId);

    const lastPage = await this.pageModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ order: -1 });

    const order = lastPage ? lastPage.order + 1 : 0;

    const page = await this.pageModel.create({
      name: data.name,
      projectId: new Types.ObjectId(projectId),
      order,
    });

    return {
      id: page._id.toString(),
      name: page.name,
      order: page.order,
      canvasData: page.canvasData,
      projectId: page.projectId.toString(),
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; canvasData?: Record<string, any> },
  ) {
    await this.findById(id, userId);

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.canvasData !== undefined) updateData.canvasData = data.canvasData;

    const page = await this.pageModel
      .findByIdAndUpdate(id, updateData, { new: true });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return {
      id: page._id.toString(),
      name: page.name,
      order: page.order,
      canvasData: page.canvasData,
      projectId: page.projectId.toString(),
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  async reorder(id: string, userId: string, data: { order: number }) {
    await this.findById(id, userId);

    await this.pageModel.findByIdAndUpdate(id, { order: data.order });

    return { success: true };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);

    await this.pageModel.findByIdAndDelete(id);

    return { success: true };
  }

  async duplicate(id: string, userId: string) {
    const page = await this.findById(id, userId);

    const lastPage = await this.pageModel
      .findOne({ projectId: new Types.ObjectId(page.projectId) })
      .sort({ order: -1 });

    const newPage = await this.pageModel.create({
      name: `${page.name} (Copy)`,
      projectId: new Types.ObjectId(page.projectId),
      order: lastPage ? lastPage.order + 1 : 0,
      canvasData: page.canvasData,
    });

    return {
      id: newPage._id.toString(),
      name: newPage.name,
      order: newPage.order,
      canvasData: newPage.canvasData,
      projectId: newPage.projectId.toString(),
      createdAt: newPage.createdAt,
      updatedAt: newPage.updatedAt,
    };
  }
}
