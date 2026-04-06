import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CanvasService, ExcalidrawElement } from './canvas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('canvas')
@Controller('canvas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @Post(':projectId/:pageId')
  @ApiOperation({ summary: 'Save canvas scene' })
  async saveScene(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() body: { elements: any[] },
    @Request() req,
  ) {
    await this.canvasService.saveScene(projectId, pageId, body.elements);
    return { success: true };
  }

  @Get(':projectId/:pageId')
  @ApiOperation({ summary: 'Get canvas scene' })
  async getScene(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Request() req,
  ): Promise<{ elements: ExcalidrawElement[] }> {
    const elements = await this.canvasService.getScene(projectId, pageId);
    return { elements };
  }

  @Delete(':projectId/:pageId')
  @ApiOperation({ summary: 'Delete canvas scene' })
  async deleteScene(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Request() req,
  ) {
    await this.canvasService.deleteScene(projectId, pageId);
    return { success: true };
  }
}
