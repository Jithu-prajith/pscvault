import React, { useEffect, useState } from 'react';
import { Page, PageSummary } from '../../domain/types';
import { usePageRepo } from '../../infrastructure/RepositoryProvider';
import { usePageStore } from '../../stores/pageStore';
import { Plus, Search, FileText, Trash2, Edit2, ArrowUpDown, BookOpen, Layers, Check, X } from 'lucide-react';
import { formatISTDateTime } from '../../lib/utils';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';

interface ChapterContainerViewProps {
  chapter: Page;
}

export const ChapterContainerView: React.FC<ChapterContainerViewProps> = ({ chapter }) => {
  const pageRepo = usePageRepo();
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);
  const updatePageTitle = usePageStore((s) => s.updatePageTitle);

  const [topics, setTopics] = useState<PageSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Load child topics & check for auto-migration of chapter notes
  useEffect(() => {
    let isMounted = true;

    async function loadChapterTopics() {
      if (!chapter) return;

      // 1. Fetch subpages for this chapter
      const subpages = await pageRepo.getSubpages(chapter.id);

      // 2. Data Safety Rule: Check if chapter has legacy rich-text note content
      const chapterContentObj = typeof chapter.content === 'string'
        ? JSON.parse(chapter.content || '{}')
        : chapter.content;

      const hasContent = chapterContentObj &&
        Array.isArray(chapterContentObj.content) &&
        chapterContentObj.content.length > 0 &&
        chapterContentObj.content.some((block: any) =>
          block.type === 'paragraph' ? (block.content && block.content.length > 0) : true
        );

      // If chapter contains existing notes and has 0 topics, auto-migrate to Topic 1.1
      if (hasContent && subpages.length === 0) {
        console.log('📦 Auto-migrating existing chapter notes into Topic 1.1...');
        const migratedTopic = await pageRepo.createTopic(chapter.id, 'Chapter Notes Overview');
        await pageRepo.updateContent(migratedTopic.id, chapterContentObj);
        
        // Clear chapter content after safe migration
        await pageRepo.update(chapter.id, { content: { type: 'doc', content: [] } });

        const refreshed = await pageRepo.getSubpages(chapter.id);
        if (isMounted) setTopics(refreshed);
        return;
      }

      if (isMounted) setTopics(subpages);
    }

    loadChapterTopics();
    return () => { isMounted = false; };
  }, [chapter.id]);

  const handleCreateTopic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTopicTitle.trim()) return;

    try {
      const created = await pageRepo.createTopic(chapter.id, newTopicTitle.trim());
      setIsAddTopicOpen(false);
      setNewTopicTitle('');

      // Refresh list
      const refreshed = await pageRepo.getSubpages(chapter.id);
      setTopics(refreshed);

      // Open newly created topic directly in note editor
      const fullPage = await pageRepo.getById(created.id);
      if (fullPage) setCurrentPage(fullPage);
    } catch (err) {
      console.error('Failed creating topic:', err);
    }
  };

  const handleRenameTopic = async (topicId: string) => {
    if (!editingTitle.trim()) return;
    await pageRepo.update(topicId, { title: editingTitle.trim() });
    setEditingTopicId(null);
    setEditingTitle('');

    const refreshed = await pageRepo.getSubpages(chapter.id);
    setTopics(refreshed);
  };

  const handleDeleteTopic = async (topicId: string) => {
    await pageRepo.softDelete(topicId);
    const refreshed = await pageRepo.getSubpages(chapter.id);
    setTopics(refreshed);
  };

  const filteredTopics = topics.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.numbering && t.numbering.includes(searchQuery))
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 dark:bg-slate-900 select-none">
      
      {/* Top Header Row */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center justify-between shrink-0">
        <Breadcrumbs />
        <div className="text-xs text-slate-400 font-medium">
          Chapter Container Index • {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
        </div>
      </div>

      {/* Main Container Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* Chapter Container Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-bold shrink-0">
                {chapter.icon || '📁'}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {chapter.numbering ? `Chapter ${chapter.numbering}` : 'Chapter Container'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {chapter.title}
                </h1>
              </div>
            </div>

            {/* Primary "+ Add Topic" Button */}
            <button
              onClick={() => setIsAddTopicOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Topic</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <span>Created: {formatISTDateTime(chapter.createdAt)}</span>
            <span>•</span>
            <span>Sub-topics count: {topics.length}</span>
          </div>
        </div>

        {/* Subtopics Section Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Topics ({filteredTopics.length})
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sub-topics..."
              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Add Topic Inline Dialog Modal */}
        {isAddTopicOpen && (
          <form onSubmit={handleCreateTopic} className="bg-brand-500/10 border-2 border-brand-500/30 rounded-2xl p-4 mb-6 shadow-md">
            <h3 className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2 uppercase">
              Create New Topic under Chapter {chapter.numbering || '1'}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Topic Name (e.g. Indus Valley Civilization)"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow transition-colors"
              >
                Create Topic
              </button>
              <button
                type="button"
                onClick={() => { setIsAddTopicOpen(false); setNewTopicTitle(''); }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Topics List */}
        {filteredTopics.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No sub-topics created yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Click "+ Add Topic" above to create your first sub-topic note page.</p>
            <button
              onClick={() => setIsAddTopicOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Topic</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md flex items-center justify-between gap-4"
              >
                {/* Topic Icon + Numbering + Title */}
                <div
                  onClick={async () => {
                    const full = await pageRepo.getById(topic.id);
                    if (full) setCurrentPage(full);
                  }}
                  className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg shrink-0">
                    {topic.icon || '📄'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {topic.numbering && (
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded">
                          {topic.numbering}
                        </span>
                      )}
                      
                      {editingTopicId === topic.id ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-sm font-semibold rounded focus:outline-none"
                          />
                          <button
                            onClick={() => handleRenameTopic(topic.id)}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTopicId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                          {topic.title}
                        </h3>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={async () => {
                      const full = await pageRepo.getById(topic.id);
                      if (full) setCurrentPage(full);
                    }}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Open Note
                  </button>
                  <button
                    onClick={() => { setEditingTopicId(topic.id); setEditingTitle(topic.title); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Rename Topic"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Delete Topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
