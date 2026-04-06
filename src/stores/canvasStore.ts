'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { Page, Project } from '@/types';

interface CanvasState {
  currentProject: Project | null;
  currentPage: Page | null;
  pages: Page[];
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  setCurrentPage: (page: Page | null) => void;
  loadProject: (projectId: string) => Promise<void>;
  loadPages: (projectId: string) => Promise<void>;
  createPage: (projectId: string, name: string) => Promise<Page>;
  updatePage: (projectId: string, pageId: string, data: { name?: string; canvasData?: object }) => Promise<void>;
  deletePage: (projectId: string, pageId: string) => Promise<void>;
  saveCanvasData: (projectId: string, pageId: string, canvasData: object) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  currentProject: null,
  currentPage: null,
  pages: [],
  isLoading: false,

  setCurrentProject: (project) => set({ currentProject: project }),

  setCurrentPage: (page) => set({ currentPage: page }),

  loadProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const project = await api.getProject(projectId);
      set({ currentProject: project, pages: project.pages || [] });
      if (project.pages?.length > 0) {
        set({ currentPage: project.pages[0] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadPages: async (projectId: string) => {
    const pages = await api.getPages(projectId);
    set({ pages });
  },

  createPage: async (projectId: string, name: string) => {
    const page = await api.createPage(projectId, name);
    set((state) => ({ pages: [...state.pages, page] }));
    return page;
  },

  updatePage: async (projectId: string, pageId: string, data) => {
    const updated = await api.updatePage(projectId, pageId, data);
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? updated : p)),
      currentPage: state.currentPage?.id === pageId ? updated : state.currentPage,
    }));
  },

  deletePage: async (projectId: string, pageId: string) => {
    await api.deletePage(projectId, pageId);
    set((state) => {
      const newPages = state.pages.filter((p) => p.id !== pageId);
      return {
        pages: newPages,
        currentPage: state.currentPage?.id === pageId ? (newPages[0] || null) : state.currentPage,
      };
    });
  },

  saveCanvasData: async (projectId: string, pageId: string, canvasData: object) => {
    await api.updatePage(projectId, pageId, { canvasData });
  },
}));
