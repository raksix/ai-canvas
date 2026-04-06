import { Injectable, BadRequestException } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  prompt: string;
  messages?: ChatMessage[];
  provider?: 'openai' | 'anthropic' | 'gemini' | 'minimax';
}

interface DiagramNode {
  id: string;
  label: string;
  type: 'rectangle' | 'circle' | 'diamond';
  x?: number;
  y?: number;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramRequest {
  prompt: string;
}

export interface DiagramResponse {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

@Injectable()
export class AiService {
  constructor(private aiSettingsService: AiSettingsService) {}

  async chat(userId: string, request: ChatRequest): Promise<{ response: string }> {
    const apiKey = await this.aiSettingsService.getApiKey(userId);

    if (!apiKey) {
      throw new BadRequestException('API key not configured. Please add your API key in settings.');
    }

    const provider = request.provider || 'openai';

    try {
      if (provider === 'openai') {
        return await this.callOpenAI(apiKey, request);
      } else if (provider === 'anthropic') {
        return await this.callAnthropic(apiKey, request);
      } else if (provider === 'gemini') {
        return await this.callGemini(apiKey, request);
      } else if (provider === 'minimax') {
        return await this.callMinimax(apiKey, request);
      }

      throw new BadRequestException('Unsupported provider');
    } catch (error: any) {
      console.error('AI chat error:', error);
      throw new BadRequestException(`AI request failed: ${error.message}`);
    }
  }

  private async callOpenAI(apiKey: string, request: ChatRequest): Promise<{ response: string }> {
    const messages: ChatMessage[] = request.messages || [];
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return { response: data.choices[0].message.content };
  }

  private async callAnthropic(apiKey: string, request: ChatRequest): Promise<{ response: string }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return { response: data.content[0].text };
  }

  private async callGemini(apiKey: string, request: ChatRequest): Promise<{ response: string }> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return { response: data.candidates[0].content.parts[0].text };
  }

  private async callMinimax(apiKey: string, request: ChatRequest): Promise<{ response: string }> {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Minimax API error');
    }

    const data = await response.json();
    return { response: data.choices[0].message.content };
  }

  async generateDiagram(userId: string, request: DiagramRequest): Promise<DiagramResponse> {
    const apiKey = await this.aiSettingsService.getApiKey(userId);

    if (!apiKey) {
      throw new BadRequestException('API key not configured');
    }

    const prompt = `Generate a diagram based on the following description. Return ONLY a JSON object with this exact structure:
{
  "nodes": [
    {"id": "node1", "label": "Label", "type": "rectangle" | "circle" | "diamond", "x": 100, "y": 100},
    ...
  ],
  "edges": [
    {"from": "node1", "to": "node2", "label": "optional label"},
    ...
  ]
}

Description: ${request.prompt}

Return ONLY the JSON, no other text.`;

    const result = await this.chat(userId, { prompt });

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const diagram = JSON.parse(jsonMatch[0]);

      if (!diagram.nodes || !Array.isArray(diagram.nodes)) {
        diagram.nodes = [];
      }
      if (!diagram.edges || !Array.isArray(diagram.edges)) {
        diagram.edges = [];
      }

      return diagram;
    } catch (error) {
      console.error('Diagram parsing error:', error);
      throw new BadRequestException('Failed to generate diagram. Please try again.');
    }
  }

  async testConnection(
    userId: string,
    provider: string,
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Say "OK"' }],
            max_tokens: 10,
          }),
        });

        if (!response.ok) {
          return { success: false, message: 'Invalid API key or quota exceeded' };
        }
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Say "OK"' }],
          }),
        });

        if (!response.ok) {
          return { success: false, message: 'Invalid API key or quota exceeded' };
        }
      } else if (provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "OK"' }] }],
            }),
          },
        );

        if (!response.ok) {
          return { success: false, message: 'Invalid API key or quota exceeded' };
        }
      } else if (provider === 'minimax') {
        const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'MiniMax-Text-01',
            messages: [{ role: 'user', content: 'Say "OK"' }],
            max_tokens: 10,
          }),
        });

        if (!response.ok) {
          return { success: false, message: 'Invalid API key or quota exceeded' };
        }
      }

      return { success: true, message: 'Connection successful!' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export type { DiagramNode, DiagramEdge };
