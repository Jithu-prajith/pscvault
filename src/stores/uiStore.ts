import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  pagesSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  searchModalOpen: boolean;
  commandPaletteOpen: boolean;
  storageManagerOpen: boolean;
  versionHistoryOpen: boolean;
  templatePickerOpen: boolean;
  activeMobileTab: 'notebooks' | 'pages' | 'editor' | 'inspector';
  fullscreenViewer: { isOpen: boolean; type: 'image' | 'pdf' | null; url: string | null; title: string | null };

  toggleSidebar: () => void;
  togglePagesSidebar: () => void;
  toggleRightSidebar: () => void;
  setActiveMobileTab: (tab: 'notebooks' | 'pages' | 'editor' | 'inspector') => void;
  setSearchModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setStorageManagerOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setTemplatePickerOpen: (open: boolean) => void;
  openFullscreenViewer: (type: 'image' | 'pdf', url: string, title?: string) => void;
  closeFullscreenViewer: () => void;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: !isMobile,
  pagesSidebarOpen: !isMobile,
  rightSidebarOpen: false,
  searchModalOpen: false,
  commandPaletteOpen: false,
  storageManagerOpen: false,
  versionHistoryOpen: false,
  templatePickerOpen: false,
  activeMobileTab: 'editor',
  fullscreenViewer: { isOpen: false, type: null, url: null, title: null },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePagesSidebar: () => set((state) => ({ pagesSidebarOpen: !state.pagesSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setStorageManagerOpen: (open) => set({ storageManagerOpen: open }),
  setVersionHistoryOpen: (open) => set({ versionHistoryOpen: open }),
  setTemplatePickerOpen: (open) => set({ templatePickerOpen: open }),
  openFullscreenViewer: (type, url, title) => set({
    fullscreenViewer: { isOpen: true, type, url, title: title || null }
  }),
  closeFullscreenViewer: () => set({
    fullscreenViewer: { isOpen: false, type: null, url: null, title: null }
  }),
}));
