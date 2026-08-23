import React, { useEffect, useState } from 'react';
import { History, X, RotateCcw, Clock } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { usePageStore } from '../../stores/pageStore';
import { useRevisionRepo, usePageRepo } from '../../infrastructure/RepositoryProvider';
import { PageRevision } from '../../domain/types';
import { formatDate } from '../../lib/utils';

export const VersionHistoryModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.versionHistoryOpen);
  const close = useUIStore((s) => s.setVersionHistoryOpen);
  const currentPage = usePageStore((s) => s.currentPage);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const revisionRepo = useRevisionRepo();
  const pageRepo = usePageRepo();

  const [revisions, setRevisions] = useState<PageRevision[]>([]);
  const [selectedRev, setSelectedRev] = useState<PageRevision | null>(null);

  useEffect(() => {
    if (isOpen && currentPage) {
      revisionRepo.getRevisions(currentPage.id).then((revs) => {
        setRevisions(revs);
        if (revs.length > 0) setSelectedRev(revs[0]);
      });
    }
  }, [isOpen, currentPage]);

  if (!isOpen || !currentPage) return null;

  const handleRestore = async (rev: PageRevision) => {
    if (!confirm(`Restore version ${rev.version} saved on ${formatDate(rev.createdAt)}?`)) return;

    await revisionRepo.restoreRevision(rev.id);
    const updated = await pageRepo.getById(currentPage.id);
    setCurrentPage(updated);
    close(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-base">
            <History className="w-5 h-5 text-brand-500" />
            <span>Version History — {currentPage.title}</span>
          </div>
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Revisions List */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-2 flex flex-col gap-1 bg-slate-50/50 dark:bg-slate-950/50">
            {revisions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No previous versions saved yet. Versions auto-save as you edit.</div>
            ) : (
              revisions.map((rev) => (
                <button
                  key={rev.id}
                  onClick={() => setSelectedRev(rev)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedRev?.id === rev.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Version {rev.version}</span>
                    <span className="text-[10px] opacity-80">{formatDate(rev.createdAt)}</span>
                  </div>
                  <p className="text-[11px] opacity-80 truncate mt-1">{rev.changeSummary || 'Auto-save checkpoint'}</p>
                </button>
              ))
            )}
          </div>

          {/* Revision Preview Area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
            {selectedRev ? (
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {selectedRev.title}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(selectedRev.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedRev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Version</span>
                  </button>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-xs text-slate-400 italic mb-2">Content snapshot preview:</p>
                  <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto text-slate-700 dark:text-slate-300">
                    {JSON.stringify(selectedRev.contentSnapshot, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select a version from the left panel to preview or restore.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
