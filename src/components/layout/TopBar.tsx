import React from 'react';
import { Award, Search, Moon, Sun, HardDrive, Command, PanelLeft, PanelRight, Check, Cloud, User as UserIcon, LogIn, FileText, Layers } from 'lucide-react';
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

  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const setProfileModalOpen = useAuthStore((s) => s.setProfileModalOpen);

  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const togglePagesSidebar = useUIStore((s) => s.togglePagesSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const setSearchModalOpen = useUIStore((s) => s.setSearchModalOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setStorageManagerOpen = useUIStore((s) => s.setStorageManagerOpen);

  const saveStatus = usePageStore((s) => s.saveStatus);

  return (
    <header className="h-14 bg-slate-900 text-white border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between shrink-0 select-none z-20">
      
      {/* Left: Sidebar Toggles + Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Notebooks Tree"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <button
          onClick={togglePagesSidebar}
          className="p-1.5 md:hidden hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Pages & Topics"
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-tight text-white">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <span className="hidden xs:inline">PSCVault</span>
          <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded font-semibold uppercase">
            UPSC
          </span>
        </div>
      </div>

      {/* Center: Search Trigger (Responsive width) */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 text-xs transition-colors group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 shrink-0 transition-colors" />
            <span className="truncate">Search notes, PDFs...</span>
          </div>
          <div className="hidden md:flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50">
            <Command className="w-2.5 h-2.5" />
            <span>F</span>
          </div>
        </button>
      </div>

      {/* Right: User Account, Cloud Sync, Theme, Inspector */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Autosave Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1 bg-slate-800/40 rounded-lg">
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Account Pill */}
        {isAuthenticated && user ? (
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs transition-colors"
            title="User Account & Cloud Sync"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200 hidden sm:inline truncate max-w-[90px]">{user.name}</span>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow transition-colors shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log In</span>
          </button>
        )}

        <button
          onClick={() => setStorageManagerOpen(true)}
          className="p-1.5 sm:p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Trash & Storage"
        >
          <HardDrive className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleRightSidebar}
          className="p-1.5 sm:p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Toggle Inspector"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
