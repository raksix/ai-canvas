import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../../models/project.schema';
import { Page, PageDocument } from '../../models/page.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
  ) {}

  async findAll(userId: string) {
    const projects = await this.projectModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 });

    const projectsWithPages = await Promise.all(
      projects.map(async (project) => {
        const pages = await this.pageModel
          .find({ projectId: project._id })
          .sort({ order: 1 });

        return {
          id: project._id.toString(),
          title: project.title,
          userId: project.userId.toString(),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          pages: pages.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            order: p.order,
            projectId: p.projectId.toString(),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
          _count: { pages: pages.length },
        };
      }),
    );

    return projectsWithPages;
  }

  async findById(id: string, userId: string) {
    const project = await this.projectModel.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const pages = await this.pageModel
      .find({ projectId: project._id })
      .sort({ order: 1 });

    return {
      id: project._id.toString(),
      title: project.title,
      userId: project.userId.toString(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      pages: pages.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        order: p.order,
        projectId: p.projectId.toString(),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }

  async create(userId: string, data: { title: string }) {
    const project = await this.projectModel.create({
      title: data.title,
      userId: new Types.ObjectId(userId),
    });

    const page = await this.pageModel.create({
      name: 'Page 1',
      order: 0,
      projectId: project._id,
    });

    return {
      id: project._id.toString(),
      title: project.title,
      userId: project.userId.toString(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      pages: [
        {
          id: page._id.toString(),
          name: page.name,
          order: page.order,
          projectId: page.projectId.toString(),
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
      ],
    };
  }

  async update(id: string, userId: string, data: { title?: string }) {
    const project = await this.findById(id, userId);

    const updated = await this.projectModel.findByIdAndUpdate(
      id,
      { title: data.title ?? project.title },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    return {
      id: updated._id.toString(),
      title: updated.title,
      userId: updated.userId.toString(),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId);

    await this.projectModel.findByIdAndDelete(id);
    await this.pageModel.deleteMany({ projectId: new Types.ObjectId(id) });

    return { success: true };
  }
}
