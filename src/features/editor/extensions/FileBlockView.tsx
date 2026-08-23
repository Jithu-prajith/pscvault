import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Paperclip, FileSpreadsheet, FileCode, FileArchive, FileText, Download, Trash2, ExternalLink } from 'lucide-react';
import { formatBytes } from '../../../lib/utils';

export const FileBlockView: React.FC<NodeViewProps> = ({ node, deleteNode, selected }) => {
  const { src, fileName, fileSize, mimeType, mediaType } = node.attrs;

  const getFileIcon = () => {
    if (mimeType?.includes('sheet') || mimeType?.includes('excel') || fileName?.endsWith('.csv')) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return <FileText className="w-6 h-6 text-blue-400" />;
    }
    if (mediaType === 'archive' || fileName?.endsWith('.zip') || fileName?.endsWith('.rar')) {
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    }
    if (mimeType?.includes('json') || mimeType?.includes('javascript') || mimeType?.includes('code')) {
      return <FileCode className="w-6 h-6 text-purple-400" />;
    }
    return <Paperclip className="w-6 h-6 text-slate-400" />;
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName || 'attachment';
    a.click();
  };

  return (
    <NodeViewWrapper className="my-4 select-none">
      <div className={`flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl border transition-all ${selected ? 'ring-2 ring-brand-500 border-brand-500 shadow-md' : 'border-slate-800 shadow-sm hover:border-slate-700'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {getFileIcon()}
          </div>
          <div>
            <h4 className="font-medium text-slate-100 text-sm truncate max-w-[280px] sm:max-w-[380px]">
              {fileName || 'Attached File'}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{formatBytes(fileSize || 0)}</span>
              {mediaType && <span className="uppercase text-[10px] px-1 py-0.2 bg-slate-800 rounded font-semibold text-slate-400">{mediaType}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Open File"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={deleteNode}
            className="p-1.5 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            title="Delete File Block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
