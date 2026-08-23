import React, { useState } from 'react';
import { Tag as TagIcon, BookOpen, Paperclip, History, Star, Plus, X, FileText, ImageIcon, Music } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { usePageStore } from '../../stores/pageStore';
import { useAuthStore } from '../../stores/authStore';
import { usePageRepo, useTagRepo } from '../../infrastructure/RepositoryProvider';
import { UPSC_PAPERS } from '../../lib/constants';
import { UPSC_SYLLABUS } from '../../shared/upscSyllabus';

export const RightSidebar: React.FC = () => {
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const setVersionHistoryOpen = useUIStore((s) => s.setVersionHistoryOpen);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  const currentPage = usePageStore((s) => s.currentPage);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);
  const currentAttachments = usePageStore((s) => s.currentAttachments);
  const currentTags = usePageStore((s) => s.currentTags);

  const pageRepo = usePageRepo();
  const tagRepo = useTagRepo();

  const [newTagName, setNewTagName] = useState('');

  if (!rightSidebarOpen || !currentPage) return null;

  const handleToggleFavorite = async () => {
    const nextState = await pageRepo.toggleFavorite(currentPage.id);
    setCurrentPage({ ...currentPage, isFavorite: nextState });
  };

  const handleUpdateSyllabus = async (paper: string, subject: string, topic: string) => {
    const updated = await pageRepo.update(currentPage.id, {
      syllabusPaper: paper,
      syllabusSubject: subject,
      syllabusTopic: topic,
    });
    setCurrentPage(updated);
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !currentWorkspace) return;

    const existingTags = await tagRepo.getAll(currentWorkspace.id);
    let targetTag = existingTags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());

    if (!targetTag) {
      targetTag = await tagRepo.create({
        workspaceId: currentWorkspace.id,
        name: newTagName.trim(),
        color: '#6366f1',
      });
    }

    await tagRepo.assignToPage(currentPage.id, targetTag.id);
    const updatedTags = await tagRepo.getPageTags(currentPage.id);
    usePageStore.getState().setCurrentTags(updatedTags);
    setNewTagName('');
  };

  const handleRemoveTag = async (tagId: string) => {
    await tagRepo.removeFromPage(currentPage.id, tagId);
    const updatedTags = await tagRepo.getPageTags(currentPage.id);
    usePageStore.getState().setCurrentTags(updatedTags);
  };

  return (
    <aside className="w-72 bg-slate-900/40 dark:bg-slate-950/90 border-l border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none z-10 overflow-y-auto p-4 gap-6 text-xs">
      
      {/* Top Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Page Inspector</span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg border transition-colors ${
              currentPage.isFavorite
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-amber-500'
            }`}
            title="Favorite Page"
          >
            <Star className={`w-4 h-4 ${currentPage.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => setVersionHistoryOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
            title="Version History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* UPSC Syllabus Mapping */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <span>UPSC Syllabus Mapping</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">GS Paper</label>
            <select
              value={currentPage.syllabusPaper || ''}
              onChange={(e) => handleUpdateSyllabus(e.target.value, currentPage.syllabusSubject || '', currentPage.syllabusTopic || '')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="">Unmapped Paper</option>
              {UPSC_PAPERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Subject</label>
            <select
              value={currentPage.syllabusSubject || ''}
              onChange={(e) => handleUpdateSyllabus(currentPage.syllabusPaper || '', e.target.value, currentPage.syllabusTopic || '')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="">Select Subject</option>
              {UPSC_SYLLABUS.map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.paper})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <TagIcon className="w-4 h-4 text-brand-500" />
          <span>Tags</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {currentTags.map(t => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-white shadow-sm"
              style={{ backgroundColor: t.color || '#6366f1' }}
            >
              <span>#{t.name}</span>
              <button onClick={() => handleRemoveTag(t.id)} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddTag} className="flex gap-1.5 mt-1">
          <input
            type="text"
            placeholder="Add tag... (e.g. Polity)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
          />
          <button type="submit" className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-500">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Embedded Attachments List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Paperclip className="w-4 h-4 text-brand-500" />
          <span>Page Attachments ({currentAttachments.length})</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {currentAttachments.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic">No files attached to this page yet. Use "+ Insert" to attach PDFs, images, or voice notes.</div>
          ) : (
            currentAttachments.map(att => (
              <div key={att.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <div className="flex items-center gap-2 truncate">
                  {att.mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  {att.mediaType === 'pdf' && <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  {att.mediaType === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{att.originalFileName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </aside>
  );
};
