import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ImageViewerModal: React.FC = () => {
  const { isOpen, type, url, title } = useUIStore((s) => s.fullscreenViewer);
  const close = useUIStore((s) => s.closeFullscreenViewer);
  const [zoom, setZoom] = React.useState(1);

  if (!isOpen || type !== 'image' || !url) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = title || 'image.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 text-white">
        <h3 className="font-semibold text-sm truncate max-w-md">{title || 'Image Viewer'}</h3>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono text-slate-400 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1" />

          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={close}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <img
          src={url}
          alt={title || ''}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform duration-150"
        />
      </div>
    </div>
  );
};
