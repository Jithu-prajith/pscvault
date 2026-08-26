import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

import { ImageBlock } from '../editor/extensions/ImageBlock';
import { PdfBlock } from '../editor/extensions/PdfBlock';
import { AudioBlock } from '../editor/extensions/AudioBlock';
import { FileBlock } from '../editor/extensions/FileBlock';
import { FileDropHandler } from '../editor/extensions/FileDropHandler';
import { ClipboardPasteHandler } from '../editor/extensions/ClipboardPasteHandler';

import { EditorToolbar } from '../editor/EditorToolbar';
import { InsertMenuModal } from '../editor/InsertMenuModal';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DrawingCanvas } from '../drawing/DrawingCanvas';
import { ChapterContainerView } from './ChapterContainerView';

import { usePageStore } from '../../stores/pageStore';
import { usePageRepo, useAttachmentRepo, useTagRepo } from '../../infrastructure/RepositoryProvider';
import { BookOpen, Edit3 } from 'lucide-react';
import { NOTEBOOK_ICONS } from '../../lib/constants';
import { formatISTDateTime } from '../../lib/utils';
import { DrawingStroke } from '../../domain/types';

export const PageView: React.FC = () => {
  const currentPage = usePageStore((s) => s.currentPage);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);
  const setSaveStatus = usePageStore((s) => s.setSaveStatus);
  const updatePageTitle = usePageStore((s) => s.updatePageTitle);
  const setCurrentAttachments = usePageStore((s) => s.setCurrentAttachments);
  const setCurrentTags = usePageStore((s) => s.setCurrentTags);

  const pageRepo = usePageRepo();
  const attachmentRepo = useAttachmentRepo();
  const tagRepo = useTagRepo();

  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [drawingActive, setDrawingActive] = useState(false);
  const [pageStrokes, setPageStrokes] = useState<DrawingStroke[]>([]);
  const saveTimerRef = useRef<number | null>(null);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Write your study notes... Type / for slash commands or click "+ Insert" to attach PDFs, images, or record voice notes.',
      }),
      ImageBlock,
      PdfBlock,
      AudioBlock,
      FileBlock,
      FileDropHandler,
      ClipboardPasteHandler,
    ],
    content: currentPage?.content || {},
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6 text-slate-900 dark:text-slate-100 text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        if (!currentPage) return;
        setSaveStatus('saving');
        try {
          const json = editor.getJSON();
          await pageRepo.updateContent(currentPage.id, json);
          setSaveStatus('saved');
        } catch (e) {
          console.warn('Autosave error:', e);
          setSaveStatus('error');
        }
      }, 1500);
    },
  });

  // Sync editor content when active page changes
  useEffect(() => {
    if (!currentPage) return;
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(currentPage.content || {});
    }

    // Load attachments & tags for current page
    attachmentRepo.getByPage(currentPage.id).then(setCurrentAttachments);
    tagRepo.getPageTags(currentPage.id).then(setCurrentTags);
  }, [currentPage?.id]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 text-slate-400 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <BookOpen className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No page selected</p>
        <p className="text-xs text-slate-400 mt-1">Select a section, chapter, or topic from the sidebar to start studying.</p>
      </div>
    );
  }

  // REQUIREMENT 2 — CHAPTER SHOULD BE A CONTAINER
  // Render Chapter Container Dashboard when active page is of type 'chapter'
  if (currentPage.type === 'chapter') {
    return <ChapterContainerView chapter={currentPage} />;
  }

  const handleTitleBlur = async () => {
    if (currentPage) {
      await pageRepo.update(currentPage.id, { title: currentPage.title });
    }
  };

  const handleSelectIcon = async (icon: string) => {
    setShowIconPicker(false);
    const updated = await pageRepo.update(currentPage.id, { icon });
    setCurrentPage(updated);
  };

  const handleSavePageStrokes = (strokes: DrawingStroke[]) => {
    setPageStrokes(strokes);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-white dark:bg-slate-900 relative">
      
      {/* Editor Fixed Formatting Toolbar & Handwriting Tool Button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pr-4">
        <EditorToolbar editor={editor} onOpenInsertMenu={() => setInsertMenuOpen(true)} />

        <button
          onClick={() => setDrawingActive(!drawingActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            drawingActive
              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
          title="Handwriting / Stylus / Pen & Highlighter Drawing Mode"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{drawingActive ? 'Exit Pen' : '🖊 Pen & Highlighter'}</span>
        </button>
      </div>

      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto relative">

        {/* Full-Page Drawing & Handwritten Notes Canvas */}
        <DrawingCanvas
          active={drawingActive}
          initialStrokes={pageStrokes}
          onSaveStrokes={handleSavePageStrokes}
          onClose={() => setDrawingActive(false)}
        />

        <div className="max-w-4xl mx-auto py-8 px-6">
          
          {/* Top Header Row: Breadcrumbs on Left, Automatic IST Timestamp in Top-Right */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <Breadcrumbs />

            {/* Automatic IST Date & Time in Top-Right Corner */}
            <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400/80 dark:text-slate-500/80">Created</span>
              <span>{formatISTDateTime(currentPage.createdAt)}</span>
            </div>
          </div>

          {/* Header Area: Icon, Title, Syllabus Tag Pill */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-3xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                title="Change Page Icon"
              >
                {currentPage.icon || '📄'}
              </button>

              {/* Icon Picker Popover */}
              {showIconPicker && (
                <div className="absolute top-12 left-0 z-30 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl grid grid-cols-8 gap-1">
                  {NOTEBOOK_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => handleSelectIcon(icon)}
                      className="text-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Editable Page Title */}
              <input
                type="text"
                value={currentPage.title}
                onChange={(e) => updatePageTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Untitled Page"
                className="flex-1 text-2xl sm:text-3xl font-bold bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-300 dark:placeholder-slate-700"
              />
            </div>

            {/* Sub-header Metadata Pill */}
            {(currentPage.syllabusPaper || currentPage.syllabusSubject) && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold rounded-lg border border-brand-500/20">
                  {currentPage.syllabusPaper || 'GS Paper'}
                </span>
                {currentPage.syllabusSubject && (
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {currentPage.syllabusSubject}
                  </span>
                )}
                {currentPage.syllabusTopic && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-400 italic">
                      {currentPage.syllabusTopic}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* TipTap Rich Text Editor Container */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <EditorContent editor={editor} />
          </div>

        </div>
      </div>

      {/* Universal Insert Menu Modal */}
      <InsertMenuModal
        editor={editor}
        isOpen={insertMenuOpen}
        onClose={() => setInsertMenuOpen(false)}
      />
    </div>
  );
};
