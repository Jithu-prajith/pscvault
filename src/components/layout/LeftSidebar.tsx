import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { useNotebookRepo, useSectionRepo, usePageRepo } from '../../infrastructure/RepositoryProvider';
import { Notebook, Section, SectionGroup } from '../../domain/types';

export const LeftSidebar: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  const notebooks = useWorkspaceStore((s) => s.notebooks);
  const setNotebooks = useWorkspaceStore((s) => s.setNotebooks);
  const activeNotebookId = useWorkspaceStore((s) => s.activeNotebookId);
  const setActiveNotebookId = useWorkspaceStore((s) => s.setActiveNotebookId);
  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);
  const setActiveSectionId = useWorkspaceStore((s) => s.setActiveSectionId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);

  const setStorageManagerOpen = useUIStore((s) => s.setStorageManagerOpen);
  const setTemplatePickerOpen = useUIStore((s) => s.setTemplatePickerOpen);

  const notebookRepo = useNotebookRepo();
  const sectionRepo = useSectionRepo();
  const pageRepo = usePageRepo();

  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [sectionsByNotebook, setSectionsByNotebook] = useState<Record<string, Section[]>>({});
  const [groupsByNotebook, setGroupsByNotebook] = useState<Record<string, SectionGroup[]>>({});

  if (!sidebarOpen) return null;

  const toggleNotebookExpand = async (nbId: string) => {
    const isExpanded = !!expandedNotebooks[nbId];
    setExpandedNotebooks((prev) => ({ ...prev, [nbId]: !isExpanded }));

    if (!isExpanded && (!sectionsByNotebook[nbId] || !groupsByNotebook[nbId])) {
      const [grps, secs] = await Promise.all([
        sectionRepo.getGroupsByNotebook(nbId),
        sectionRepo.getByNotebook(nbId)
      ]);

      setGroupsByNotebook((prev) => ({ ...prev, [nbId]: grps }));
      setSectionsByNotebook((prev) => ({ ...prev, [nbId]: secs }));

      // Default expand all section groups
      const initialGroupExpand: Record<string, boolean> = {};
      grps.forEach(g => { initialGroupExpand[g.id] = true; });
      setExpandedGroups((prev) => ({ ...initialGroupExpand, ...prev }));
    }
  };

  const toggleGroupExpand = (grpId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [grpId]: !prev[grpId] }));
  };

  const handleSelectSection = async (sec: Section) => {
    setActiveNotebookId(sec.notebookId);
    setActiveSectionId(sec.id);
    const pgs = await pageRepo.getBySection(sec.id);
    useWorkspaceStore.getState().setPages(pgs);
    if (pgs.length > 0) {
      setActivePageId(pgs[0].id);
      const fullPage = await pageRepo.getById(pgs[0].id);
      usePageStore.getState().setCurrentPage(fullPage);
    } else {
      setActivePageId(null);
      usePageStore.getState().setCurrentPage(null);
    }
  };

  const handleCreateNotebook = async () => {
    if (!currentWorkspace) return;
    const name = prompt('Enter Notebook Name:', 'UPSC CSE Optional Subject');
    if (!name) return;
    const newNb = await notebookRepo.create({ workspaceId: currentWorkspace.id, name });
    const all = await notebookRepo.getAll(currentWorkspace.id);
    setNotebooks(all);
    setActiveNotebookId(newNb.id);
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none z-10">
      
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notebooks</span>
        <button
          onClick={handleCreateNotebook}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Create Notebook"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Notebook & Section Group Tree */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {notebooks.map((nb) => {
          const isExpanded = !!expandedNotebooks[nb.id];
          const isNbActive = activeNotebookId === nb.id;

          const grps = groupsByNotebook[nb.id] || [];
          const secs = sectionsByNotebook[nb.id] || [];

          // Group sections by sectionGroupId
          const groupedSecsMap = new Map<string, Section[]>();
          const standaloneSecs: Section[] = [];

          secs.forEach((s) => {
            if (s.sectionGroupId) {
              const list = groupedSecsMap.get(s.sectionGroupId) || [];
              list.push(s);
              groupedSecsMap.set(s.sectionGroupId, list);
            } else {
              standaloneSecs.push(s);
            }
          });

          return (
            <div key={nb.id} className="flex flex-col">
              {/* Notebook Header Row */}
              <button
                onClick={() => {
                  setActiveNotebookId(nb.id);
                  toggleNotebookExpand(nb.id);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  isNbActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="p-0.5 text-slate-400">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
                <span className="text-sm">{nb.icon}</span>
                <span className="flex-1 truncate">{nb.name}</span>
              </button>

              {/* Expandable Section Groups & Sections */}
              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-slate-800/80 flex flex-col gap-1 mt-1 my-1">
                  
                  {/* Render Section Groups (e.g. GS I, GS II, GS III, GS IV) */}
                  {grps.map((grp) => {
                    const isGrpExpanded = expandedGroups[grp.id] !== false; // Default expanded
                    const childSecs = groupedSecsMap.get(grp.id) || [];

                    return (
                      <div key={grp.id} className="flex flex-col">
                        {/* Group Header Row (e.g. GS I) */}
                        <button
                          onClick={(e) => toggleGroupExpand(grp.id, e)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors uppercase tracking-wider"
                        >
                          <span className="text-slate-500">
                            {isGrpExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                          <span className="truncate">{grp.name}</span>
                        </button>

                        {/* Individual Subject Sections under Group */}
                        {isGrpExpanded && (
                          <div className="ml-4 flex flex-col gap-0.5 mt-0.5 mb-1">
                            {childSecs.map((sec) => {
                              const isSecActive = activeSectionId === sec.id;
                              return (
                                <button
                                  key={sec.id}
                                  onClick={() => handleSelectSection(sec)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                                    isSecActive
                                      ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                                  <span className="truncate">{sec.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render Standalone Sections (e.g. Essay, Current Affairs) */}
                  {standaloneSecs.map((sec) => {
                    const isSecActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => handleSelectSection(sec)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isSecActive
                            ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                        <span className="truncate">{sec.name}</span>
                      </button>
                    );
                  })}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Footer Links */}
      <div className="p-2 border-t border-slate-800/80 flex flex-col gap-1 text-xs">
        <button
          onClick={() => setTemplatePickerOpen(true)}
          className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <LayoutTemplate className="w-4 h-4 text-brand-400" />
          <span>UPSC Templates</span>
        </button>

        <button
          onClick={() => setStorageManagerOpen(true)}
          className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <Trash2 className="w-4 h-4 text-slate-400" />
          <span>Trash & Storage</span>
        </button>
      </div>
    </aside>
  );
};
