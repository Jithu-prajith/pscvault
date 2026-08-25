import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
  RotateCw, Maximize2, Trash2, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Edit3, Crop, Lock, Unlock, ArrowUp, ArrowDown, Copy,
  Scaling, Check
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { DrawingStroke, StrokePoint } from '../../../domain/types';
import { resolveAssetUrl } from '../../../infrastructure/fs/fileService';

export const ImageBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, storagePath, alt, title, width, rotation, alignment, zIndex, locked, annotations } = node.attrs;
  const openFullscreen = useUIStore((s) => s.openFullscreenViewer);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolved Src state to prevent disappearing images after refresh
  const [resolvedSrc, setResolvedSrc] = useState<string>(src || '');

  // Mode states
  const [annotating, setAnnotating] = useState(false);
  const [tool, setTool] = useState<'highlighter' | 'pen' | 'eraser'>('highlighter');
  const [strokeColor, setStrokeColor] = useState('#fde047');
  const [strokeWidth, setStrokeWidth] = useState(16);

  const [currentStrokes, setCurrentStrokes] = useState<DrawingStroke[]>(annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePoints, setActivePoints] = useState<StrokePoint[]>([]);

  const [currentRotation, setCurrentRotation] = useState<number>(rotation || 0);
  const [currentWidth, setCurrentWidth] = useState<number | string>(width || 500);

  // Real-time Sideways Drag Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(500);
  const resizeDirRef = useRef<'right' | 'left'>('right');

  // Load persistent asset URL on mount/update
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

  useEffect(() => {
    setCurrentStrokes(annotations || []);
  }, [annotations]);

  // Render annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numWidth = typeof currentWidth === 'number' ? currentWidth : img.clientWidth || 500;
    canvas.width = img.clientWidth || numWidth;
    canvas.height = img.clientHeight || 350;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    currentStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw active drawing stroke
    if (activePoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = tool === 'highlighter' ? 0.45 : 1.0;

      ctx.moveTo(activePoints[0].x, activePoints[0].y);
      for (let i = 1; i < activePoints.length; i++) {
        ctx.lineTo(activePoints[i].x, activePoints[i].y);
      }
      ctx.stroke();
    }
  }, [currentStrokes, activePoints, currentWidth, annotating, tool, strokeColor, strokeWidth]);

  // Pointer event handlers for drawing (Mouse / Touch / Pen Stylus)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!annotating) return;
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;

    setActivePoints([{ x, y, pressure }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !annotating) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;

    setActivePoints((prev) => [...prev, { x, y, pressure }]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !annotating) return;
    setIsDrawing(false);

    if (activePoints.length > 1) {
      const newStroke: DrawingStroke = {
        id: `stroke_${Date.now()}`,
        type: tool === 'highlighter' ? 'highlighter' : 'pen',
        points: activePoints,
        color: tool === 'eraser' ? '#ffffff' : strokeColor,
        width: strokeWidth,
        opacity: tool === 'highlighter' ? 0.45 : 1.0,
      };

      const updated = [...currentStrokes, newStroke];
      setCurrentStrokes(updated);
      updateAttributes({ annotations: updated });
    }

    setActivePoints([]);
  };

  // Rotation Handle
  const handleRotateClick = () => {
    const nextRot = (currentRotation + 45) % 360;
    setCurrentRotation(nextRot);
    updateAttributes({ rotation: nextRot });
  };

  // --- REAL-TIME SIDEWAYS DRAG RESIZING HANDLERS ---
  const startSideResize = (e: React.PointerEvent, dir: 'right' | 'left') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    isResizingRef.current = true;
    setIsResizing(true);
    startXRef.current = e.clientX;
    const currentPx = imgRef.current?.clientWidth || (typeof currentWidth === 'number' ? currentWidth : 500);
    startWidthRef.current = currentPx;
    resizeDirRef.current = dir;
  };

  const handleSideResizeMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - startXRef.current;
    let newPx = startWidthRef.current;

    if (resizeDirRef.current === 'right') {
      newPx = startWidthRef.current + deltaX;
    } else {
      newPx = startWidthRef.current - deltaX;
    }

    const clamped = Math.max(180, Math.min(1600, Math.round(newPx)));
    setCurrentWidth(clamped);
  };

  const stopSideResize = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    setIsResizing(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (typeof currentWidth === 'number') {
      updateAttributes({ width: currentWidth });
    }
  };

  // Quick Preset Width Helper
  const setPresetWidth = (preset: number | string) => {
    setCurrentWidth(preset);
    updateAttributes({ width: preset });
  };

  const alignClasses = {
    left: 'mr-auto text-left',
    center: 'mx-auto text-center',
    right: 'ml-auto text-right',
  }[alignment as 'left' | 'center' | 'right'] || 'mx-auto text-center';

  const widthStyle = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;

  return (
    <NodeViewWrapper className={`my-6 select-none group relative inline-block w-full ${alignClasses}`}>
      <div
        ref={containerRef}
        style={{
          width: widthStyle,
          transform: `rotate(${currentRotation}deg)`,
          zIndex: zIndex || 1,
        }}
        className={`relative inline-block max-w-full rounded-2xl overflow-visible border transition-all ${
          selected ? 'border-brand-500 ring-2 ring-brand-500/40 shadow-xl' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
        }`}
      >

        {/* Rotation Handle Top Icon */}
        {selected && !locked && (
          <button
            onClick={handleRotateClick}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg hover:bg-brand-500 transition-transform active:scale-95 z-30"
            title="Rotate Image 45°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Live Resize Badge */}
        {isResizing && (
          <div className="absolute -top-8 left-2 bg-brand-600 text-white font-mono text-[11px] px-2 py-0.5 rounded-md shadow-md z-40">
            {typeof currentWidth === 'number' ? `${currentWidth}px Sideways` : currentWidth}
          </div>
        )}

        {/* Toolbar Header (Selection / Annotation / Resizing Controls) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-30 text-xs shadow-lg">
          {/* Sideways Preset Width Controls */}
          <button
            onClick={() => setPresetWidth(300)}
            className={`px-1.5 py-0.5 hover:bg-slate-800 rounded font-mono text-[10px] ${currentWidth === 300 ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
            title="Enlarge 300px"
          >
            Small
          </button>
          <button
            onClick={() => setPresetWidth(600)}
            className={`px-1.5 py-0.5 hover:bg-slate-800 rounded font-mono text-[10px] ${currentWidth === 600 ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
            title="Enlarge 600px"
          >
            Medium
          </button>
          <button
            onClick={() => setPresetWidth(900)}
            className={`px-1.5 py-0.5 hover:bg-slate-800 rounded font-mono text-[10px] ${currentWidth === 900 ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
            title="Enlarge 900px Sideways"
          >
            Large
          </button>
          <button
            onClick={() => setPresetWidth('100%')}
            className={`px-1.5 py-0.5 hover:bg-slate-800 rounded font-mono text-[10px] ${currentWidth === '100%' ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
            title="Full Width Sideways (100%)"
          >
            100%
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Alignment */}
          <button
            onClick={() => updateAttributes({ alignment: 'left' })}
            className={`p-1 hover:bg-slate-800 rounded-lg ${alignment === 'left' ? 'text-brand-400' : ''}`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'center' })}
            className={`p-1 hover:bg-slate-800 rounded-lg ${alignment === 'center' ? 'text-brand-400' : ''}`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'right' })}
            className={`p-1 hover:bg-slate-800 rounded-lg ${alignment === 'right' ? 'text-brand-400' : ''}`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Toggle Image Annotation / Highlighter Mode */}
          <button
            onClick={() => {
              setAnnotating(!annotating);
              if (!annotating) {
                setTool('highlighter');
                setStrokeColor('#fde047');
                setStrokeWidth(16);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
              annotating ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-200'
            }`}
            title="Highlight / Annotate Image"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>{annotating ? 'Done' : 'Highlight'}</span>
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Fullscreen & Delete */}
          <button
            onClick={() => openFullscreen('image', resolvedSrc || src, title || alt || 'Image Preview')}
            className="p-1 hover:bg-slate-800 rounded-lg"
            title="Full Screen Viewer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={deleteNode}
            className="p-1 hover:bg-red-600 rounded-lg text-red-400 hover:text-white"
            title="Delete Image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Annotation Palette Toolbar (when Annotation Mode is active) */}
        {annotating && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-2xl border border-slate-700 shadow-2xl z-40 text-xs">
            <button
              onClick={() => { setTool('highlighter'); setStrokeWidth(16); setStrokeColor('#fde047'); }}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold ${tool === 'highlighter' ? 'bg-amber-400 text-slate-950' : 'hover:bg-slate-800'}`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlighter</span>
            </button>

            <button
              onClick={() => { setTool('pen'); setStrokeWidth(4); setStrokeColor('#ef4444'); }}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold ${tool === 'pen' ? 'bg-brand-500 text-white' : 'hover:bg-slate-800'}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 ml-1">
              {['#fde047', '#86efac', '#93c5fd', '#f472b6', '#ef4444', '#000000'].map((c) => (
                <button
                  key={c}
                  onClick={() => setStrokeColor(c)}
                  className={`w-5 h-5 rounded-full border border-white/20 transition-transform ${strokeColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <span className="w-px h-4 bg-slate-700 mx-1" />

            <button
              onClick={() => {
                setCurrentStrokes([]);
                updateAttributes({ annotations: [] });
              }}
              className="p-1 text-slate-400 hover:text-red-400"
              title="Clear Highlights"
            >
              Clear
            </button>
          </div>
        )}

        {/* Main Image Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            ref={imgRef}
            src={resolvedSrc || src}
            alt={alt || ''}
            title={title || ''}
            style={{ width: widthStyle, height: 'auto', display: 'block' }}
            className="rounded-2xl object-contain transition-all"
            onError={async () => {
              if (storagePath) {
                const url = await resolveAssetUrl(storagePath);
                if (url && url !== resolvedSrc) setResolvedSrc(url);
              }
            }}
          />

          {/* Scalable Canvas Overlay for Highlights & Pen Annotations */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute inset-0 w-full h-full ${annotating ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
          />
        </div>

        {/* --- REAL-TIME SIDEWAYS DRAG RESIZE HANDLES --- */}
        {selected && !locked && (
          <>
            {/* Right Edge Sideways Drag Handle */}
            <div
              onPointerDown={(e) => startSideResize(e, 'right')}
              onPointerMove={handleSideResizeMove}
              onPointerUp={stopSideResize}
              className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize group/handle z-30 touch-none"
              title="Drag Sideways to Enlarge Image Width"
            >
              <div className="w-3 h-8 rounded-full bg-brand-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-0.5 group-hover/handle:scale-125 transition-transform">
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="w-1 h-1 rounded-full bg-white" />
              </div>
            </div>

            {/* Left Edge Sideways Drag Handle */}
            <div
              onPointerDown={(e) => startSideResize(e, 'left')}
              onPointerMove={handleSideResizeMove}
              onPointerUp={stopSideResize}
              className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize group/handle z-30 touch-none"
              title="Drag Sideways to Enlarge Image Width"
            >
              <div className="w-3 h-8 rounded-full bg-brand-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-0.5 group-hover/handle:scale-125 transition-transform">
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="w-1 h-1 rounded-full bg-white" />
              </div>
            </div>

            {/* Corner Handles */}
            <div
              onPointerDown={(e) => startSideResize(e, 'right')}
              onPointerMove={handleSideResizeMove}
              onPointerUp={stopSideResize}
              className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-brand-600 border-2 border-white shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Enlarge Image"
            />
            <div
              onPointerDown={(e) => startSideResize(e, 'left')}
              onPointerMove={handleSideResizeMove}
              onPointerUp={stopSideResize}
              className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-brand-600 border-2 border-white shadow-lg cursor-nesw-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Enlarge Image"
            />
          </>
        )}

        {/* Optional Caption */}
        {alt && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic text-center px-2 py-0.5">
            {alt}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
