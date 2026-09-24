import { create } from 'zustand';
import { User, Workspace } from '../domain/types';
import { getDeviceId } from '../infrastructure/sync/deviceInfo';
import { SyncEngine } from '../infrastructure/sync/SyncEngine';

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
  refreshToken: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<User | null>;
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error', time?: string) => void;
}

function getStoredSession(): { user: User; token: string } | null {
  try {
    const raw = localStorage.getItem('pscvault_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(user: User, token: string) {
  try {
    localStorage.setItem('pscvault_session', JSON.stringify({ user, token }));
  } catch (e) {
    console.warn('Failed saving session:', e);
  }
}

// Initialize state from stored session
const initialSession = getStoredSession();

export const useAuthStore = create<AuthState>((set, get) => ({
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

  // REAL BACKEND LOGIN VIA BCRYPT + JWT SIGNING
  login: async (email, password) => {
    const emailKey = email.trim().toLowerCase();
    const deviceId = getDeviceId();
    const apiBase = SyncEngine.getApiBaseUrl();

    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ email: emailKey, password, deviceId }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        return {
          success: false,
          message: data.error || data.detail || 'Invalid credentials. Please check your email and password.'
        };
      }

      // Store real server JWT token and user profile
      saveStoredSession(data.user, data.token);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        authModalOpen: false,
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
      });

      // Immediately pull any existing cloud workspace
      try {
        await SyncEngine.syncOnLogin(data.token);
      } catch (syncErr) {
        console.warn('Initial cloud sync warning after login:', syncErr);
      }

      return { success: true };
    } catch (e: any) {
      console.warn('Backend login network warning:', e);

      // Offline Fallback for existing session on same device
      const existing = getStoredSession();
      if (existing && existing.user.email?.toLowerCase() === emailKey) {
        set({
          user: existing.user,
          token: existing.token,
          isAuthenticated: true,
          authModalOpen: false,
          syncStatus: 'offline',
        });
        return { success: true };
      }

      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your connection.'
      };
    }
  },

  // REAL BACKEND REGISTRATION VIA BCRYPT + JWT SIGNING
  register: async (name, email, password) => {
    const emailKey = email.trim().toLowerCase();
    const deviceId = getDeviceId();
    const apiBase = SyncEngine.getApiBaseUrl();

    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({
          name: name.trim(),
          email: emailKey,
          password,
          targetExamYear: '2027',
          deviceId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        return {
          success: false,
          message: data.error || data.detail || 'Registration failed. Please try again.'
        };
      }

      // Store real server JWT token and user profile
      saveStoredSession(data.user, data.token);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        authModalOpen: false,
        syncStatus: 'synced',
        lastSyncTime: new Date().toISOString(),
      });

      // Immediately pull or create any initial cloud workspace
      try {
        await SyncEngine.syncOnLogin(data.token);
      } catch (syncErr) {
        console.warn('Initial cloud sync warning after register:', syncErr);
      }

      return { success: true };
    } catch (e: any) {
      console.warn('Backend registration network warning:', e);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your network connection.'
      };
    }
  },

  // REAL LOGOUT
  logout: () => {
    const currentToken = get().token;
    const apiBase = SyncEngine.getApiBaseUrl();

    if (currentToken) {
      fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'x-device-id': getDeviceId(),
        },
      }).catch(() => {});
    }

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

  // REAL BACKEND TOKEN REFRESH
  refreshToken: async () => {
    const currentToken = get().token;
    if (!currentToken) return false;
    const apiBase = SyncEngine.getApiBaseUrl();

    try {
      const res = await fetch(`${apiBase}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'x-device-id': getDeviceId(),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        return false;
      }

      const currentUser = get().user;
      if (currentUser) {
        saveStoredSession(currentUser, data.token);
      }
      set({ token: data.token });
      return true;
    } catch (e) {
      console.warn('Backend refresh token network warning:', e);
      return false;
    }
  },

  // REAL BACKEND CURRENT USER PROFILE (/me)
  fetchCurrentUser: async () => {
    const currentToken = get().token;
    if (!currentToken) return null;
    const apiBase = SyncEngine.getApiBaseUrl();

    try {
      const res = await fetch(`${apiBase}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'x-device-id': getDeviceId(),
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          get().logout();
        }
        return null;
      }

      const data = await res.json();
      if (data && data.id) {
        saveStoredSession(data, currentToken);
        set({ user: data, isAuthenticated: true });
        return data;
      }
      return null;
    } catch (e) {
      console.warn('Backend fetch profile network warning:', e);
      return null;
    }
  },

  setSyncStatus: (status, time) => set((s) => ({
    syncStatus: status,
    lastSyncTime: time || s.lastSyncTime
  })),
}));
