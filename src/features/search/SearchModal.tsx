import React, { useState, useEffect } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { useSearchRepo, usePageRepo } from '../../infrastructure/RepositoryProvider';
import { SearchResult } from '../../domain/types';

export const SearchModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.searchModalOpen);
  const close = useUIStore((s) => s.setSearchModalOpen);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  const searchRepo = useSearchRepo();
  const pageRepo = usePageRepo();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim() || !currentWorkspace) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchRepo.search(currentWorkspace.id, query);
        setResults(res);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, currentWorkspace]);

  if (!isOpen) return null;

  const handleSelectResult = async (res: SearchResult) => {
    const page = await pageRepo.getById(res.pageId);
    if (page) {
      setCurrentPage(page);
      setActivePageId(page.id);
    }
    close(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            type="text"
            placeholder="Search all notes, PDFs, topics, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 text-sm focus:outline-none placeholder-slate-400 font-medium"
            autoFocus
          />
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {searching ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching your notes...</div>
          ) : results.length === 0 && query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching notes found for "{query}".</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Type a keyword, topic, or subject to search across all notebooks.</div>
          ) : (
            results.map((res) => (
              <button
                key={res.id}
                onClick={() => handleSelectResult(res)}
                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate group-hover:text-brand-500 transition-colors">
                      {res.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                      <span>{res.notebookName}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span>{res.sectionName}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {res.snippet}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
