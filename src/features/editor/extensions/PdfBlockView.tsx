import React, { useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { FileText, Eye, Download, Trash2, Sparkles } from 'lucide-react';
import { formatBytes } from '../../../lib/utils';
import { useUIStore } from '../../../stores/uiStore';
import { resolveAssetUrl } from '../../../infrastructure/fs/fileService';

export const PdfBlockView: React.FC<NodeViewProps> = ({ node, deleteNode, selected }) => {
  const { src, storagePath, fileName, fileSize, pageCount } = node.attrs;
  const openFullscreen = useUIStore((s) => s.openFullscreenViewer);

  const [resolvedSrc, setResolvedSrc] = useState<string>(src || '');

  useEffect(() => {
    let isMounted = true;
    async function loadSrc() {
      if (src && (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://'))) {
        if (isMounted) setResolvedSrc(src);
        return;
      }
      if (storagePath) {
        const url = await resolveAssetUrl(storagePath);
        if (isMounted && url) setResolvedSrc(url);
      } else if (src) {
        const url = await resolveAssetUrl(src);
        if (isMounted && url) setResolvedSrc(url);
      }
    }
    loadSrc();
    return () => { isMounted = false; };
  }, [src, storagePath]);

  const handleDownload = () => {
    const targetUrl = resolvedSrc || src;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = fileName || 'document.pdf';
    a.click();
  };

  return (
    <NodeViewWrapper className="my-4 select-none">
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900 text-white rounded-xl border transition-all ${selected ? 'ring-2 ring-brand-500 shadow-md border-brand-500' : 'border-slate-800 shadow-sm hover:border-slate-700'}`}>
        
        {/* Left: PDF Icon + Info */}
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-100 text-sm truncate max-w-[280px] sm:max-w-[360px]">
                {fileName || 'PDF Document'}
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-semibold uppercase">
                PDF
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>{formatBytes(fileSize || 0)}</span>
              {pageCount && (
                <>
                  <span>•</span>
                  <span>{pageCount} Pages</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
          <button
            onClick={() => openFullscreen('pdf', resolvedSrc || src, fileName || 'PDF Document')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open PDF</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            disabled
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/50 text-slate-500 rounded-lg text-xs cursor-not-allowed"
            title="AI Summarize (Phase 4)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
            <span className="text-[10px]">AI</span>
          </button>

          <button
            onClick={deleteNode}
            className="p-1.5 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            title="Delete PDF Block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
