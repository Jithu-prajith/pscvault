import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Highlighter, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Table2, Quote, AlertCircle, Code, Minus, Plus, Undo, Redo
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenInsertMenu: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onOpenInsertMenu }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 p-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
      
      {/* Universal Prominent + Insert / Attach Button */}
      <button
        onClick={onOpenInsertMenu}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow transition-colors shrink-0 mr-1"
        title="Universal Insert Menu (+ Insert / Attach)"
      >
        <Plus className="w-4 h-4" />
        <span>+ Insert</span>
      </button>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

      {/* Formatting buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold' : ''}`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400' : ''}`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400' : ''}`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('strike') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400' : ''}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('highlight') ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : ''}`}
        title="Highlight text"
      >
        <Highlighter className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 font-bold' : ''}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 font-bold' : ''}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-800 text-brand-600 font-bold' : ''}`}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

      {/* Lists & Checklists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : ''}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : ''}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('taskList') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : ''}`}
        title="Task Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

      {/* Structure */}
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        title="Insert 3x3 Table"
      >
        <Table2 className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : ''}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ${editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : ''}`}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        title="Divider Rule"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-[8px]" />

      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 shrink-0"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 shrink-0"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};
