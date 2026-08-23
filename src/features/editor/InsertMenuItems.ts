import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Table2,
  Quote, AlertCircle, Code, Minus, Link2, ImageIcon, FileText, Paperclip, Music,
  Mic, Video, Pencil, BookOpen, Zap, HelpCircle, Newspaper, Layers, Scale, Building,
  Sparkles, GitBranch, Workflow
} from 'lucide-react';

export interface InsertMenuItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: 'Basic' | 'Media' | 'UPSC' | 'AI';
  command: string;
  action: 'editor-command' | 'file-picker' | 'recorder' | 'inline';
  accept?: string;
  phase?: number;
}

export const INSERT_MENU_ITEMS: InsertMenuItem[] = [
  // Basic Text Blocks
  { id: 'text',       label: 'Text',           description: 'Plain text paragraph',            icon: Type,          category: 'Basic', command: 'paragraph',       action: 'editor-command' },
  { id: 'heading1',   label: 'Heading 1',      description: 'Main section heading',            icon: Heading1,      category: 'Basic', command: 'heading1',        action: 'editor-command' },
  { id: 'heading2',   label: 'Heading 2',      description: 'Sub-section heading',             icon: Heading2,      category: 'Basic', command: 'heading2',        action: 'editor-command' },
  { id: 'heading3',   label: 'Heading 3',      description: 'Small topic heading',             icon: Heading3,      category: 'Basic', command: 'heading3',        action: 'editor-command' },
  { id: 'bulletList', label: 'Bullet List',     description: 'Simple bulleted list',           icon: List,          category: 'Basic', command: 'bulletList',      action: 'editor-command' },
  { id: 'numberList', label: 'Numbered List',   description: 'Sequential numbered list',       icon: ListOrdered,   category: 'Basic', command: 'orderedList',     action: 'editor-command' },
  { id: 'checklist',  label: 'Checklist',       description: 'Interactive task checklist',      icon: CheckSquare,   category: 'Basic', command: 'taskList',        action: 'editor-command' },
  { id: 'table',      label: 'Table',           description: 'Insert a 3x3 comparison table',   icon: Table2,        category: 'Basic', command: 'table',           action: 'editor-command' },
  { id: 'quote',      label: 'Quote',           description: 'Blockquote for quotes/citations', icon: Quote,         category: 'Basic', command: 'blockquote',      action: 'editor-command' },
  { id: 'callout',    label: 'Callout',         description: 'Highlighted alert container',    icon: AlertCircle,   category: 'Basic', command: 'callout',         action: 'editor-command' },
  { id: 'code',       label: 'Code Block',      description: 'Syntax highlighted code',        icon: Code,          category: 'Basic', command: 'codeBlock',       action: 'editor-command' },
  { id: 'divider',    label: 'Divider',         description: 'Horizontal separator line',       icon: Minus,         category: 'Basic', command: 'horizontalRule',  action: 'editor-command' },

  // Media & Attachments (Core Phase 1)
  { id: 'image',      label: 'Image',           description: 'Embed PNG, JPG, WEBP, GIF',       icon: ImageIcon,     category: 'Media', command: 'imageBlock',      action: 'file-picker', accept: 'image/*' },
  { id: 'pdf',        label: 'PDF Document',    description: 'Embed PDF viewer & preview',     icon: FileText,      category: 'Media', command: 'pdfBlock',        action: 'file-picker', accept: 'application/pdf' },
  { id: 'file',       label: 'File Attachment', description: 'Attach DOCX, XLSX, PPTX, ZIP',    icon: Paperclip,     category: 'Media', command: 'fileBlock',       action: 'file-picker', accept: '*' },
  { id: 'audio',      label: 'Audio File',      description: 'Attach MP3, WAV, WebM audio',    icon: Music,         category: 'Media', command: 'audioBlock',      action: 'file-picker', accept: 'audio/*' },
  { id: 'voice',      label: 'Voice Recording', description: 'Record voice note directly',     icon: Mic,           category: 'Media', command: 'audioRecord',     action: 'recorder' },

  // Future Media (Phase 2)
  { id: 'video',      label: 'Video',           description: 'Embed MP4, WebM video player',    icon: Video,         category: 'Media', command: 'videoBlock',      action: 'file-picker', accept: 'video/*', phase: 2 },
  { id: 'drawing',    label: 'Drawing Block',   description: 'Excalidraw whiteboard canvas',    icon: Pencil,        category: 'Media', command: 'excalidrawBlock', action: 'inline', phase: 2 },

  // UPSC-Specific Blocks (Phase 3)
  { id: 'definition',    label: 'Definition',    description: 'Key terms & official definitions', icon: BookOpen,  category: 'UPSC', command: 'definition', action: 'editor-command', phase: 3 },
  { id: 'prelimsFact',   label: 'Prelims Fact',  description: 'High-yield prelims fact box',      icon: Zap,       category: 'UPSC', command: 'prelimsFact', action: 'editor-command', phase: 3 },
  { id: 'mainsPoint',    label: 'Mains Point',   description: 'Structured Mains 15-marker point', icon: FileText,  category: 'UPSC', command: 'mainsPoint', action: 'editor-command', phase: 3 },
  { id: 'pyq',           label: 'PYQ Question',  description: 'Previous year question block',    icon: HelpCircle,category: 'UPSC', command: 'pyq', action: 'editor-command', phase: 3 },
  { id: 'currentAffair', label: 'Current Affair',description: 'Newspaper clipping note',         icon: Newspaper, category: 'UPSC', command: 'currentAffair', action: 'editor-command', phase: 3 },
  { id: 'flashcard',     label: 'Flashcard',     description: 'Question & answer card',          icon: Layers,    category: 'UPSC', command: 'flashcard', action: 'editor-command', phase: 3 },

  // AI Generators (Phase 4)
  { id: 'aiContent',     label: 'AI Generate',   description: 'Generate study notes with AI',    icon: Sparkles,  category: 'AI', command: 'aiGenerate', action: 'editor-command', phase: 4 },
  { id: 'mindMap',       label: 'Mind Map',      description: 'Generate visual mindmap',         icon: GitBranch, category: 'AI', command: 'mindMap', action: 'editor-command', phase: 4 },
  { id: 'flowchart',     label: 'Flowchart',     description: 'Generate process flowchart',      icon: Workflow,  category: 'AI', command: 'flowchart', action: 'editor-command', phase: 4 },
];
