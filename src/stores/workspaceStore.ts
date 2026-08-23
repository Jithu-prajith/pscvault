import { create } from 'zustand';
import { Workspace, Notebook, Section, PageSummary } from '../domain/types';

interface WorkspaceState {
  workspaces: Workspace[];
  notebooks: Notebook[];
  sections: Section[];
  pages: PageSummary[];
  activeWorkspaceId: string | null;
  activeNotebookId: string | null;
  activeSectionId: string | null;
  activePageId: string | null;
  
  setWorkspaces: (workspaces: Workspace[]) => void;
  setNotebooks: (notebooks: Notebook[]) => void;
  setSections: (sections: Section[]) => void;
  setPages: (pages: PageSummary[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveNotebookId: (id: string | null) => void;
  setActiveSectionId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  notebooks: [],
  sections: [],
  pages: [],
  activeWorkspaceId: null,
  activeNotebookId: null,
  activeSectionId: null,
  activePageId: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setNotebooks: (notebooks) => set({ notebooks }),
  setSections: (sections) => set({ sections }),
  setPages: (pages) => set({ pages }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setActiveNotebookId: (id) => set({ activeNotebookId: id, activeSectionId: null, activePageId: null }),
  setActiveSectionId: (id) => set({ activeSectionId: id, activePageId: null }),
  setActivePageId: (id) => set({ activePageId: id }),
}));
