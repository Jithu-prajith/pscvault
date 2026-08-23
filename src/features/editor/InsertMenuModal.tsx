import React, { useState, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { INSERT_MENU_ITEMS, InsertMenuItem } from './InsertMenuItems';
import { Editor } from '@tiptap/react';
import { saveAttachmentFile, classifyMediaType } from '../../infrastructure/fs/fileService';

interface InsertMenuModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InsertMenuModal: React.FC<InsertMenuModalProps> = ({ editor, isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Basic' | 'Media' | 'UPSC' | 'AI'>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingItem, setPendingItem] = useState<InsertMenuItem | null>(null);

  if (!isOpen || !editor) return null;

  const categories = ['All', 'Basic', 'Media', 'UPSC', 'AI'];

  const filteredItems = INSERT_MENU_ITEMS.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectItem = (item: InsertMenuItem) => {
    if (item.phase && item.phase > 1) {
      alert(`${item.label} is planned for Phase ${item.phase} and will be enabled soon!`);
      return;
    }

    if (item.action === 'file-picker') {
      setPendingItem(item);
      if (fileInputRef.current) {
        fileInputRef.current.accept = item.accept || '*';
        fileInputRef.current.click();
      }
      return;
    }

    if (item.action === 'recorder') {
      editor.chain().focus().insertContent({
        type: 'audioBlock',
        attrs: { isRecordingMode: true },
      }).run();
      onClose();
      return;
    }

    // Editor command actions
    switch (item.command) {
      case 'paragraph':      editor.chain().focus().setParagraph().run(); break;
      case 'heading1':       editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'heading2':       editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'heading3':       editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'bulletList':     editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList':    editor.chain().focus().toggleOrderedList().run(); break;
      case 'taskList':       editor.chain().focus().toggleTaskList().run(); break;
      case 'table':          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
      case 'blockquote':     editor.chain().focus().toggleBlockquote().run(); break;
      case 'codeBlock':      editor.chain().focus().toggleCodeBlock().run(); break;
      case 'horizontalRule': editor.chain().focus().setHorizontalRule().run(); break;
    }

    onClose();
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !pendingItem) return;

    const file = files[0];
    const mediaType = classifyMediaType(file.type);
    const data = new Uint8Array(await file.arrayBuffer());

    const saved = await saveAttachmentFile(data, file.name, mediaType);

    switch (pendingItem.command) {
      case 'imageBlock':
        editor.chain().focus().insertContent({
          type: 'imageBlock',
          attrs: { src: saved.assetUrl, alt: file.name },
        }).run();
        break;
      case 'pdfBlock':
        editor.chain().focus().insertContent({
          type: 'pdfBlock',
          attrs: { src: saved.assetUrl, fileName: file.name, fileSize: data.byteLength },
        }).run();
        break;
      case 'audioBlock':
        editor.chain().focus().insertContent({
          type: 'audioBlock',
          attrs: { src: saved.assetUrl, fileName: file.name, fileSize: data.byteLength },
        }).run();
        break;
      default:
        editor.chain().focus().insertContent({
          type: 'fileBlock',
          attrs: { src: saved.assetUrl, fileName: file.name, fileSize: data.byteLength, mimeType: file.type, mediaType },
        }).run();
    }

    setPendingItem(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilePicked}
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header with Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search blocks, media, UPSC tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 text-sm focus:outline-none placeholder-slate-400"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isPhaseLocked = item.phase && item.phase > 1;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  isPhaseLocked
                    ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/50 cursor-pointer'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  item.category === 'Media' ? 'bg-blue-500/10 text-blue-500' :
                  item.category === 'UPSC' ? 'bg-amber-500/10 text-amber-500' :
                  item.category === 'AI' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-brand-500/10 text-brand-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                      {item.label}
                    </span>
                    {isPhaseLocked && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded font-mono">
                        Phase {item.phase}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Pro tip: Type <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">/image</kbd> or <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">/pdf</kbd> directly in the editor</span>
        </div>
      </div>
    </div>
  );
};
