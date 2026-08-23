import { create } from 'zustand';
import { Page, Attachment, Tag } from '../domain/types';

interface PageState {
  currentPage: Page | null;
  currentAttachments: Attachment[];
  currentTags: Tag[];
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt: string | null;

  setCurrentPage: (page: Page | null) => void;
  setCurrentAttachments: (attachments: Attachment[]) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  setCurrentTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void;
  updatePageTitle: (title: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  currentPage: null,
  currentAttachments: [],
  currentTags: [],
  saveStatus: 'saved',
  lastSavedAt: null,

  setCurrentPage: (page) => set({ currentPage: page, saveStatus: 'saved' }),
  setCurrentAttachments: (currentAttachments) => set({ currentAttachments }),
  addAttachment: (attachment) => set((state) => ({
    currentAttachments: [...state.currentAttachments.filter(a => a.id !== attachment.id), attachment]
  })),
  removeAttachment: (id) => set((state) => ({
    currentAttachments: state.currentAttachments.filter(a => a.id !== id)
  })),
  setCurrentTags: (currentTags) => set({ currentTags }),
  addTag: (tag) => set((state) => ({
    currentTags: [...state.currentTags.filter(t => t.id !== tag.id), tag]
  })),
  removeTag: (tagId) => set((state) => ({
    currentTags: state.currentTags.filter(t => t.id !== tagId)
  })),
  setSaveStatus: (saveStatus) => set({
    saveStatus,
    lastSavedAt: saveStatus === 'saved' ? new Date().toLocaleTimeString() : undefined
  }),
  updatePageTitle: (title) => set((state) => ({
    currentPage: state.currentPage ? { ...state.currentPage, title } : null,
    saveStatus: 'unsaved'
  })),
}));
