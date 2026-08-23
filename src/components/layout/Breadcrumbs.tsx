import React, { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useSectionRepo, usePageRepo } from '../../infrastructure/RepositoryProvider';
import { Section, SectionGroup, PageSummary } from '../../domain/types';

export const Breadcrumbs: React.FC = () => {
  const currentPage = usePageStore((s) => s.currentPage);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const activeSectionId = useWorkspaceStore((s) => s.activeSectionId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);

  const sectionRepo = useSectionRepo();
  const pageRepo = usePageRepo();

  const [section, setSection] = useState<Section | null>(null);
  const [sectionGroup, setSectionGroup] = useState<SectionGroup | null>(null);
  const [parentChapter, setParentChapter] = useState<PageSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentPage) {
      setSection(null);
      setSectionGroup(null);
      setParentChapter(null);
      return;
    }

    (async () => {
      // 1. Resolve section
      const sec = await sectionRepo.getById(currentPage.sectionId);
      if (!isMounted) return;
      setSection(sec);

      // 2. Resolve section group if present
      if (sec?.sectionGroupId) {
        const grps = await sectionRepo.getGroupsByNotebook(sec.notebookId);
        const grp = grps.find((g) => g.id === sec.sectionGroupId);
        if (isMounted) setSectionGroup(grp || null);
      } else {
        if (isMounted) setSectionGroup(null);
      }

      // 3. Resolve parent chapter if page has parentId
      if (currentPage.parentId) {
        const parent = await pageRepo.getById(currentPage.parentId);
        if (isMounted) setParentChapter(parent);
      } else {
        if (isMounted) setParentChapter(null);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentPage?.id, currentPage?.sectionId, currentPage?.parentId]);

  if (!currentPage || !section) return null;

  const handleSelectChapter = async (chapId: string) => {
    const chap = await pageRepo.getById(chapId);
    if (chap) {
      setActivePageId(chap.id);
      setCurrentPage(chap);
    }
  };

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3 select-none flex-wrap font-medium">
      {/* Section Group */}
      {sectionGroup && (
        <>
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {sectionGroup.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </>
      )}

      {/* Subject Section */}
      <span className="text-slate-800 dark:text-slate-200 font-semibold">
        {section.name}
      </span>

      {/* Chapter Parent */}
      {parentChapter && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => handleSelectChapter(parentChapter.id)}
            className="hover:text-brand-500 transition-colors text-slate-700 dark:text-slate-300 font-semibold hover:underline"
          >
            {parentChapter.title}
          </button>
        </>
      )}

      {/* Current Page / Topic */}
      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-brand-600 dark:text-brand-400 font-bold truncate max-w-[200px]">
        {currentPage.title}
      </span>
    </nav>
  );
};
