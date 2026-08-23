import React, { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useUIStore } from '../../stores/uiStore';

// Point pdf.worker to worker file
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfViewerModal: React.FC = () => {
  const { isOpen, type, url, title } = useUIStore((s) => s.fullscreenViewer);
  const close = useUIStore((s) => s.closeFullscreenViewer);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);

  if (!isOpen || type !== 'pdf' || !url) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = title || 'document.pdf';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 text-white shrink-0">
        <h3 className="font-semibold text-sm truncate max-w-md">{title || 'PDF Viewer'}</h3>

        {/* Page Navigation */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <span className="font-semibold text-brand-400">{pageNumber}</span> of {numPages || '--'}
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={close}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            title="Close Viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto flex justify-center p-6 bg-slate-900/50">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-8 text-slate-400 text-sm">Loading PDF document...</div>}
          error={<div className="p-8 text-red-400 text-sm">Failed to load PDF file.</div>}
          className="shadow-2xl bg-white dark:bg-slate-900 rounded-lg overflow-hidden"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};
