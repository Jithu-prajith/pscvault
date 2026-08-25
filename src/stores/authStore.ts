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

  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error', time?: string) => void;
}

// Helpers for persistent account storage
function getStoredAccounts(): Record<string, User & { passwordHash: string }> {
  try {
    const raw = localStorage.getItem('pscvault_user_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, User & { passwordHash: string }>) {
  try {
    localStorage.setItem('pscvault_user_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed saving user accounts:', e);
  }
}

function getStoredSession(): { user: User; token: string } | null {
  try {
    const raw = localStorage.getItem('pscvault_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sanitizeUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

// Initialize state from stored session
const initialSession = getStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession?.user || null,
  currentWorkspace: null,
  theme: 'light',
  token: initialSession?.token || null,
  isAuthenticated: !!initialSession?.user,
  syncStatus: initialSession?.user ? 'synced' : 'offline',
  lastSyncTime: initialSession?.user ? new Date().toISOString() : null,
  authModalOpen: !initialSession?.user,
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
    const emailKey = email.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const existing = accounts[emailKey];

    if (existing) {
      if (existing.passwordHash !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      const { passwordHash, ...userObj } = existing;
      const token = `jwt_${Date.now()}`;
      localStorage.setItem('pscvault_session', JSON.stringify({ user: userObj, token }));

      set({
        user: userObj,
        token,
        isAuthenticated: true,
        authModalOpen: false,
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
      });
      return { success: true };
    }

    // Auto-create account for new login email if not yet registered
    const userId = sanitizeUserId(emailKey);
    const newUser: User = {
      id: userId,
      name: email.split('@')[0] || 'UPSC Candidate',
      email: emailKey,
      avatarPath: null,
      preferences: { theme: 'light', onboardingCompleted: false, targetExamYear: '2027' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts[emailKey] = { ...newUser, passwordHash: password };
    saveAccounts(accounts);

    const token = `jwt_${Date.now()}`;
    localStorage.setItem('pscvault_session', JSON.stringify({ user: newUser, token }));

    set({
      user: newUser,
      token,
      isAuthenticated: true,
      authModalOpen: false,
      syncStatus: 'synced',
      lastSyncTime: new Date().toISOString(),
    });
    return { success: true };
  },

  register: async (name, email, password) => {
    const emailKey = email.trim().toLowerCase();
    const accounts = getStoredAccounts();

    if (accounts[emailKey]) {
      return { success: false, message: 'An account already exists with this email. Please log in.' };
    }

    const userId = sanitizeUserId(emailKey);
    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: emailKey,
      avatarPath: null,
      preferences: { theme: 'light', onboardingCompleted: false, targetExamYear: '2027' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts[emailKey] = { ...newUser, passwordHash: password };
    saveAccounts(accounts);

    const token = `jwt_${Date.now()}`;
    localStorage.setItem('pscvault_session', JSON.stringify({ user: newUser, token }));

    set({
      user: newUser,
      token,
      isAuthenticated: true,
      authModalOpen: false,
      syncStatus: 'synced',
      lastSyncTime: new Date().toISOString(),
    });
    return { success: true };
  },

  logout: () => {
    try {
      localStorage.removeItem('pscvault_session');
    } catch (e) {
      console.warn('Failed clearing session:', e);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authModalOpen: true,
      syncStatus: 'offline',
    });
  },

  setSyncStatus: (status, time) => set((s) => ({
    syncStatus: status,
    lastSyncTime: time || s.lastSyncTime
  })),
}));
