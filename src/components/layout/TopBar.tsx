import React from 'react';
import { Award, Search, Moon, Sun, HardDrive, Command, PanelLeft, PanelRight, Check, Cloud, CloudOff, User as UserIcon, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';

export const TopBar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const theme = useAuthStore((s) => s.theme);
  const toggleTheme = useAuthStore((s) => s.toggleTheme);
  const syncStatus = useAuthStore((s) => s.syncStatus);

  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const setProfileModalOpen = useAuthStore((s) => s.setProfileModalOpen);

  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const setSearchModalOpen = useUIStore((s) => s.setSearchModalOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setStorageManagerOpen = useUIStore((s) => s.setStorageManagerOpen);

  const saveStatus = usePageStore((s) => s.saveStatus);
  const lastSavedAt = usePageStore((s) => s.lastSavedAt);

  return (
    <header className="h-14 bg-slate-900 text-white border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none z-20">
      
      {/* Left: Sidebar Toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Notebook Tree Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-bold text-base tracking-tight text-white">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow">
            <Award className="w-4 h-4" />
          </div>
          <span>PSCVault</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded font-semibold uppercase">
            UPSC OS
          </span>
        </div>

        {currentWorkspace && (
          <span className="hidden md:inline-flex text-xs text-slate-400 border-l border-slate-800 pl-3">
            {currentWorkspace.name}
          </span>
        )}
      </div>

      {/* Center: Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 text-xs transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transition-colors" />
            <span>Search all notes, PDFs, topics...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50">
            <Command className="w-2.5 h-2.5" />
            <span>F</span>
          </div>
        </button>
      </div>

      {/* Right: User Account, Cloud Sync, Trash & Settings */}
      <div className="flex items-center gap-2">
        {/* Autosave Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1 bg-slate-800/40 rounded-lg">
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400" title={`Last saved at ${lastSavedAt || 'just now'}`}>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* User Account / Cloud Sync Pill */}
        {isAuthenticated && user ? (
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs transition-colors"
            title="User Account & Cloud Sync Status"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">{user.name}</span>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        )}

        <button
          onClick={() => setStorageManagerOpen(true)}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Trash & Storage Manager"
        >
          <HardDrive className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Command Palette (Ctrl+K)"
        >
          <Command className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleRightSidebar}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Properties Sidebar"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
