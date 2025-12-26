import { Project, ProjectDetail } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Fallback to status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

export const api = {
  // Projects
  async listProjects(): Promise<{ projects: string[] }> {
    return fetchApi('/projects');
  },

  async createProject(name: string): Promise<Project> {
    return fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getProjectDetail(name: string): Promise<ProjectDetail> {
    return fetchApi(`/projects/${encodeURIComponent(name)}`);
  },

  // Images
  async uploadImage(projectName: string, file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },

  async deleteImage(projectName: string, filename: string): Promise<{ deleted: boolean }> {
    return fetchApi(`/projects/${encodeURIComponent(projectName)}/images/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  },

  // README
  async getReadme(projectName: string): Promise<{ content: string }> {
    return fetchApi(`/projects/${encodeURIComponent(projectName)}/readme`);
  },

  async updateReadme(projectName: string, content: string): Promise<{ content: string }> {
    return fetchApi(`/projects/${encodeURIComponent(projectName)}/readme`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },
};