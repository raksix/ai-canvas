export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Project {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  pages: Page[];
  _count?: {
    pages: number;
  };
}

export interface Page {
  id: string;
  name: string;
  order: number;
  canvasData: Record<string, unknown>;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | 'gemini';
  hasApiKey: boolean;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: 'rectangle' | 'circle' | 'diamond';
  x?: number;
  y?: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface CanvasState {
  currentProjectId: string | null;
  currentPageId: string | null;
  pages: Page[];
  isLoading: boolean;
}
