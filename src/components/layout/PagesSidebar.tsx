import React, { useState } from 'react';
import { Plus, FolderPlus, FilePlus, ChevronRight, ChevronDown, Star, Folder, FileText, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { usePageRepo } from '../../infrastructure/RepositoryProvider';
import { PageSummary } from '../../domain/types';
import { formatDate } from '../../lib/utils';

export const PagesSidebar: React.FC = () => {
  const pages = useWorkspaceStore((s) => s.pages);
  const setPages = useWorkspaceStore((s) => s.setPages);
  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);
  const activePageId = useWorkspaceStore((s) => s.activePageId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);

  const pageRepo = usePageRepo();
  const currentPage = usePageStore((s) => s.currentPage);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const handleSelectPage = async (p: PageSummary) => {
    setActivePageId(p.id);
    const fullPage = await pageRepo.getById(p.id);
    setCurrentPage(fullPage);
  };

  const handleCreateChapter = async () => {
    if (!activeSectionId) {
      alert('Please select a subject section first.');
      return;
    }

    const titleInput = prompt('Enter Chapter Title:', 'Ancient India');
    if (titleInput === null) return;

    const newChap = await pageRepo.createChapter(activeSectionId, titleInput.trim());
    const updatedPages = await pageRepo.getBySection(activeSectionId);
    setPages(updatedPages);

    setCurrentPage(newChap);
    setActivePageId(newChap.id);
  };

  const handleCreateTopic = async (chapterId?: string) => {
    if (!activeSectionId) {
      alert('Please select a subject section first.');
      return;
    }

    let targetChapterId = chapterId;
    if (!targetChapterId && currentPage) {
      targetChapterId = currentPage.type === 'chapter' ? currentPage.id : (currentPage.parentId || undefined);
    }

    if (!targetChapterId) {
      const chapters = pages.filter((p) => p.type === 'chapter');
      if (chapters.length > 0) {
        targetChapterId = chapters[0].id;
      } else {
        const newChap = await pageRepo.createChapter(activeSectionId, 'General Notes');
        targetChapterId = newChap.id;
      }
    }

    const titleInput = prompt('Enter Topic Name:', 'Indus Valley Civilization');
    if (titleInput === null) return;

    const newTopic = await pageRepo.createTopic(targetChapterId, titleInput.trim());
    const updatedPages = await pageRepo.getBySection(activeSectionId);
    setPages(updatedPages);

    setCurrentPage(newTopic);
    setActivePageId(newTopic.id);
  };

  const handleDeletePage = async (p: PageSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemType = p.type === 'chapter' ? 'Chapter (and all topics under it)' : 'Item';
    if (!confirm(`Move ${itemType} "${p.title}" to Trash?\nYou can restore it anytime from Trash & Storage.`)) return;

    await pageRepo.softDelete(p.id);
    if (activeSectionId) {
      const updatedPages = await pageRepo.getBySection(activeSectionId);
      setPages(updatedPages);
      if (activePageId === p.id) {
        setActivePageId(null);
        setCurrentPage(null);
      }
    }
  };

  const toggleChapterExpand = (chapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters((prev) => ({ ...prev, [chapId]: prev[chapId] === false }));
  };

  // Group pages into Chapters and Independent Pages
  const chapters = pages.filter((p) => p.type === 'chapter');
  const standalonePages = pages.filter((p) => !p.parentId && p.type !== 'chapter');
  const topicsByChapter = new Map<string, PageSummary[]>();

  pages.filter((p) => p.parentId).forEach((p) => {
    const list = topicsByChapter.get(p.parentId!) || [];
    list.push(p);
    topicsByChapter.set(p.parentId!, list);
  });

  return (
    <aside className="w-64 bg-slate-900/60 dark:bg-slate-950/80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none z-10">
      
      {/* Header with + Chapter and + Topic buttons */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Content</span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateChapter}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
            title="Create New Chapter (Chapter 1, Chapter 2...)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Chapter</span>
          </button>

          <button
            onClick={() => handleCreateTopic()}
            className="flex items-center gap-1 px-2 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-semibold shadow transition-colors"
            title="Create New Topic under Chapter (1.1, 1.2...)"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>+ Topic</span>
          </button>
        </div>
      </div>

      {/* Chapter -> Topic Tree List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {pages.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No chapters or topics in this subject yet. Click "+ Chapter" or "+ Topic" to start.
          </div>
        ) : (
          <>
            {/* Render Chapters */}
            {chapters.map((chap) => {
              const isExpanded = expandedChapters[chap.id] !== false;
              const isChapActive = activePageId === chap.id;
              const topics = topicsByChapter.get(chap.id) || [];

              return (
                <div key={chap.id} className="flex flex-col">
                  {/* Chapter Header Row */}
                  <div
                    onClick={() => handleSelectPage(chap)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border cursor-pointer transition-all group ${
                      isChapActive
                        ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-sm ring-1 ring-brand-500 font-semibold'
                        : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleChapterExpand(chap.id, e)}
                      className="p-0.5 text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-amber-400 shrink-0 text-sm">📁</span>
                    <h4 className="text-xs font-bold flex-1 truncate">{chap.title}</h4>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTopic(chap.id);
                        }}
                        className="p-1 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded"
                        title="Add Topic under this chapter"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => handleDeletePage(chap, e)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                        title="Move Chapter to Trash"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Topics under Chapter */}
                  {isExpanded && (
                    <div className="ml-5 pl-2 border-l border-slate-800/80 flex flex-col gap-0.5 mt-1 mb-1">
                      {topics.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-1 italic">No topics yet</div>
                      ) : (
                        topics.map((top) => {
                          const isTopActive = activePageId === top.id;
                          return (
                            <button
                              key={top.id}
                              onClick={() => handleSelectPage(top)}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors group/item ${
                                isTopActive
                                  ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                              }`}
                            >
                              <span className="text-xs shrink-0">{top.icon || '📄'}</span>
                              <span className="truncate flex-1">{top.title}</span>
                              {top.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}

                              <button
                                onClick={(e) => handleDeletePage(top, e)}
                                className="p-1 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-opacity"
                                title="Move Topic to Trash"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone Pages */}
            {standalonePages.map((p) => {
              const isActive = activePageId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPage(p)}
                  className={`flex items-start gap-2.5 p-2 rounded-xl text-left border transition-all group ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-1 ring-brand-500'
                      : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{p.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-semibold truncate ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {p.title || 'Untitled'}
                      </h4>
                      <div className="flex items-center gap-1">
                        {p.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                        <button
                          onClick={(e) => handleDeletePage(p, e)}
                          className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 rounded"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{formatDate(p.updatedAt)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

    </aside>
  );
};
