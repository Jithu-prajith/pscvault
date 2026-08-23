import React, { useState } from 'react';
import { Command, Search, Plus, HardDrive, Moon, Sun, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { usePageRepo } from '../../infrastructure/RepositoryProvider';

export const CommandPaletteModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.setCommandPaletteOpen);
  const setSearchModalOpen = useUIStore((s) => s.setSearchModalOpen);
  const setStorageManagerOpen = useUIStore((s) => s.setStorageManagerOpen);
  const toggleTheme = useAuthStore((s) => s.toggleTheme);
  const theme = useAuthStore((s) => s.theme);

  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);
  const pageRepo = usePageRepo();
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const actions = [
    {
      id: 'search',
      label: 'Search Notes & Media',
      icon: Search,
      action: () => { close(false); setSearchModalOpen(true); }
    },
    {
      id: 'new_page',
      label: 'Create New Page',
      icon: Plus,
      action: async () => {
        if (!activeSectionId) {
          alert('Please select a section first.');
          return;
        }
        const newPage = await pageRepo.create({ sectionId: activeSectionId, title: 'Untitled Page' });
        setCurrentPage(newPage);
        setActivePageId(newPage.id);
        close(false);
      }
    },
    {
      id: 'theme',
      label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      icon: theme === 'light' ? Moon : Sun,
      action: () => { toggleTheme(); close(false); }
    },
    {
      id: 'storage',
      label: 'Open Storage & Backup Manager',
      icon: HardDrive,
      action: () => { close(false); setStorageManagerOpen(true); }
    },
  ];

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Command className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 text-sm focus:outline-none placeholder-slate-400 font-medium"
            autoFocus
          />
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions List */}
        <div className="p-2 flex flex-col gap-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Icon className="w-4 h-4 text-brand-500" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
