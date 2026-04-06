const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4004/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ accessToken: string; user: { id: string; email: string; name: string | null } }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
    this.setToken(data.accessToken);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; user: { id: string; email: string; name: string | null } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(data.accessToken);
    return data;
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string | null }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Projects
  async getProjects() {
    return this.request<any[]>('/projects');
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(title: string) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: { title },
    });
  }

  async updateProject(id: string, title: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: { title },
    });
  }

  async deleteProject(id: string) {
    return this.request<{ success: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Pages
  async getPages(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/pages`);
  }

  async getPage(projectId: string, pageId: string) {
    return this.request<any>(`/projects/${projectId}/pages/${pageId}`);
  }

  async createPage(projectId: string, name: string) {
    return this.request<any>(`/projects/${projectId}/pages`, {
      method: 'POST',
      body: { name },
    });
  }

  async updatePage(projectId: string, pageId: string, data: { name?: string; canvasData?: object }) {
    return this.request<any>(`/projects/${projectId}/pages/${pageId}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deletePage(projectId: string, pageId: string) {
    return this.request<{ success: boolean }>(`/projects/${projectId}/pages/${pageId}`, {
      method: 'DELETE',
    });
  }

  async duplicatePage(projectId: string, pageId: string) {
    return this.request<any>(`/projects/${projectId}/pages/${pageId}/duplicate`, {
      method: 'POST',
    });
  }

  // AI
  async aiChat(prompt: string, messages?: Array<{ role: string; content: string }>, provider?: string) {
    return this.request<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: { prompt, messages, provider },
    });
  }

  async generateDiagram(prompt: string) {
    return this.request<{ nodes: any[]; edges: any[] }>('/ai/diagram', {
      method: 'POST',
      body: { prompt },
    });
  }

  async getAISettings() {
    return this.request<{ provider: string; hasApiKey: boolean }>('/ai/settings');
  }

  async updateAISettings(provider: string, apiKey: string) {
    return this.request<{ provider: string; hasApiKey: boolean }>('/ai/settings', {
      method: 'PUT',
      body: { provider, apiKey },
    });
  }

  async testAIConnection(provider: string, apiKey: string) {
    return this.request<{ success: boolean; message: string }>('/ai/test', {
      method: 'POST',
      body: { provider, apiKey },
    });
  }

  // Canvas (MongoDB)
  async saveCanvas(projectId: string, pageId: string, elements: any[]) {
    return this.request(`/canvas/${projectId}/${pageId}`, {
      method: 'POST',
      body: { elements },
    });
  }

  async getCanvas(projectId: string, pageId: string) {
    return this.request<{ elements: any[] }>(`/canvas/${projectId}/${pageId}`);
  }
}

export const api = new ApiClient();
