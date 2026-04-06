import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService, DiagramResponse } from './ai.service';
import { AiSettingsService } from './ai-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private aiService: AiService,
    private aiSettingsService: AiSettingsService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send chat message to AI' })
  async chat(
    @Body() body: { prompt: string; messages?: Array<{ role: string; content: string }>; provider?: string },
    @Request() req,
  ) {
    return this.aiService.chat(req.user.id, {
      prompt: body.prompt,
      messages: body.messages as any,
      provider: body.provider as any,
    });
  }

  @Post('diagram')
  @ApiOperation({ summary: 'Generate diagram from prompt' })
  async generateDiagram(
    @Body() body: { prompt: string },
    @Request() req,
  ): Promise<DiagramResponse> {
    return this.aiService.generateDiagram(req.user.id, { prompt: body.prompt });
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get AI settings' })
  async getSettings(@Request() req) {
    return this.aiSettingsService.getSettings(req.user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update AI settings' })
  async updateSettings(
    @Body() body: { provider: string; apiKey: string },
    @Request() req,
  ) {
    return this.aiSettingsService.updateSettings(req.user.id, body);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test AI connection' })
  async testConnection(
    @Body() body: { provider: string; apiKey: string },
    @Request() req,
  ) {
    return this.aiService.testConnection(req.user.id, body.provider, body.apiKey);
  }
}
