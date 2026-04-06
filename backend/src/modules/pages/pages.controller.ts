import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('pages')
@Controller('projects/:projectId/pages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pages in a project' })
  async findAll(@Param('projectId') projectId: string, @Request() req) {
    return this.pagesService.findAll(projectId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.pagesService.findById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new page' })
  async create(
    @Param('projectId') projectId: string,
    @Body() body: { name: string },
    @Request() req,
  ) {
    return this.pagesService.create(projectId, req.user.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update page' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; canvasData?: object },
    @Request() req,
  ) {
    return this.pagesService.update(id, req.user.id, body);
  }

  @Put(':id/reorder')
  @ApiOperation({ summary: 'Reorder page' })
  async reorder(
    @Param('id') id: string,
    @Body() body: { order: number },
    @Request() req,
  ) {
    return this.pagesService.reorder(id, req.user.id, body);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate page' })
  async duplicate(@Param('id') id: string, @Request() req) {
    return this.pagesService.duplicate(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete page' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.pagesService.delete(id, req.user.id);
  }
}
