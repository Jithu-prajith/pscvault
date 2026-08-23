import React, { useEffect, useState } from 'react';
import { RepositoryProvider, useWorkspaceRepo, useNotebookRepo, useSectionRepo, usePageRepo } from './infrastructure/RepositoryProvider';
import { useAuthStore } from './stores/authStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { useUIStore } from './stores/uiStore';
import { usePageStore } from './stores/pageStore';

import { TopBar } from './components/layout/TopBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { PagesSidebar } from './components/layout/PagesSidebar';
import { RightSidebar } from './components/layout/RightSidebar';

import { PageView } from './features/page/PageView';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';

import { SearchModal } from './features/search/SearchModal';
import { CommandPaletteModal } from './features/command-palette/CommandPaletteModal';
import { TrashManagerModal } from './features/settings/TrashManagerModal';
import { AuthModal } from './features/auth/AuthModal';
import { UserProfileModal } from './features/auth/UserProfileModal';

import { VersionHistoryModal } from './features/page/VersionHistoryModal';
import { TemplatePickerModal } from './features/templates/TemplatePickerModal';
import { ImageViewerModal } from './features/attachments/ImageViewerModal';
import { PdfViewerModal } from './features/attachments/PdfViewerModal';

import './styles/editor.css';

const AppContent: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useAuthStore((s) => s.setCurrentWorkspace);

  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const setNotebooks = useWorkspaceStore((s) => s.setNotebooks);
  const setActiveNotebookId = useWorkspaceStore((s) => s.setActiveNotebookId);
  const setActiveSectionId = useWorkspaceStore((s) => s.setActiveSectionId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setPages = useWorkspaceStore((s) => s.setPages);

  const setSearchModalOpen = useUIStore((s) => s.setSearchModalOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const workspaceRepo = useWorkspaceRepo();
  const notebookRepo = useNotebookRepo();
  const sectionRepo = useSectionRepo();
  const pageRepo = usePageRepo();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Startup initialization
  const initApp = async () => {
    try {
      const userId = user?.id || 'usr_default';
      const wsList = await workspaceRepo.getAll(userId);
      setWorkspaces(wsList);

      if (wsList.length === 0) {
        setShowOnboarding(true);
      } else {
        const ws = wsList[0];
        setCurrentWorkspace(ws);
        setActiveWorkspaceId(ws.id);

        const nbList = await notebookRepo.getAll(ws.id);
        setNotebooks(nbList);

        if (nbList.length > 0) {
          const nb = nbList[0];
          setActiveNotebookId(nb.id);

          const secList = await sectionRepo.getByNotebook(nb.id);
          if (secList.length > 0) {
            const sec = secList[0];
            setActiveSectionId(sec.id);

            const pgList = await pageRepo.getBySection(sec.id);
            setPages(pgList);

            if (pgList.length > 0) {
              setActivePageId(pgList[0].id);
              const fullPage = await pageRepo.getById(pgList[0].id);
              setCurrentPage(fullPage);
            }
          }
        }
      }
    } catch (e) {
      console.warn('App initialization warning:', e);
      setShowOnboarding(true);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl+F / Cmd+F -> Search Modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (initLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 animate-pulse flex items-center justify-center text-xl font-bold mb-3">
          PV
        </div>
        <p className="text-xs text-slate-400">Loading PSCVault Local Storage Engine...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* Onboarding Wizard for new users */}
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}

      {/* Main Top Header */}
      <TopBar />

      {/* Application Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Notebook Tree */}
        <LeftSidebar />

        {/* Secondary Sidebar: Pages List */}
        <PagesSidebar />

        {/* Main Content Area: Editor */}
        <PageView />

        {/* Right Sidebar: Page Properties & Inspector */}
        <RightSidebar />
      </div>

      {/* Modals & Fullscreen Overlays */}
      <SearchModal />
      <CommandPaletteModal />
      <TrashManagerModal />
      <AuthModal />
      <UserProfileModal />
      <VersionHistoryModal />
      <TemplatePickerModal />
      <ImageViewerModal />
      <PdfViewerModal />

    </div>
  );
};

export function App() {
  return (
    <RepositoryProvider>
      <AppContent />
    </RepositoryProvider>
  );
}

export default App;
