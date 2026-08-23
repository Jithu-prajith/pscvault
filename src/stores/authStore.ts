import { create } from 'zustand';
import { User, Workspace } from '../domain/types';

interface AuthState {
  user: User | null;
  currentWorkspace: Workspace | null;
  theme: 'light' | 'dark';
  token: string | null;
  isAuthenticated: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: string | null;
  authModalOpen: boolean;
  profileModalOpen: boolean;

  setUser: (user: User | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setAuthModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;

  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error', time?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'usr_default',
    name: 'UPSC Aspirant',
    email: 'aspirant@pscvault.local',
    avatarPath: null,
    preferences: { theme: 'light', onboardingCompleted: true, targetExamYear: '2027' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  currentWorkspace: null,
  theme: 'light',
  token: 'mock_jwt_token_local',
  isAuthenticated: true,
  syncStatus: 'synced',
  lastSyncTime: new Date().toISOString(),
  authModalOpen: false,
  profileModalOpen: false,

  setUser: (user) => set({ user }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: next };
  }),
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),

  login: async (email, password) => {
    // Authenticate user session
    const mockUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'UPSC Candidate',
      email,
      avatarPath: null,
      preferences: { theme: 'light', onboardingCompleted: true, targetExamYear: '2027' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ user: mockUser, token: `jwt_${Date.now()}`, isAuthenticated: true, syncStatus: 'synced', lastSyncTime: new Date().toISOString() });
    return true;
  },

  register: async (name, email, password) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      avatarPath: null,
      preferences: { theme: 'light', onboardingCompleted: true, targetExamYear: '2027' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ user: newUser, token: `jwt_${Date.now()}`, isAuthenticated: true, syncStatus: 'synced', lastSyncTime: new Date().toISOString() });
    return true;
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, syncStatus: 'offline' });
  },

  setSyncStatus: (status, time) => set((s) => ({
    syncStatus: status,
    lastSyncTime: time || s.lastSyncTime
  })),
}));
