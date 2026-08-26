import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
  RotateCw, Maximize2, Trash2, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Edit3, Lock, Unlock, ArrowUp, ArrowDown, Move
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { DrawingStroke, StrokePoint } from '../../../domain/types';
import { resolveAssetUrl } from '../../../infrastructure/fs/fileService';

export const ImageBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const {
    src, storagePath, alt, title, width, height, rotation, alignment,
    zIndex, locked, aspectRatioLocked, annotations
  } = node.attrs;

  const openFullscreen = useUIStore((s) => s.openFullscreenViewer);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolved Src state to prevent disappearing images after refresh
  const [resolvedSrc, setResolvedSrc] = useState<string>(src || '');

  // Mode & Drawing states
  const [annotating, setAnnotating] = useState(false);
  const [tool, setTool] = useState<'highlighter' | 'pen' | 'eraser'>('highlighter');
  const [strokeColor, setStrokeColor] = useState('#fde047');
  const [strokeWidth, setStrokeWidth] = useState(16);

  const [currentStrokes, setCurrentStrokes] = useState<DrawingStroke[]>(annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePoints, setActivePoints] = useState<StrokePoint[]>([]);

  // Dimension & Transform States
  const [currentRotation, setCurrentRotation] = useState<number>(rotation || 0);
  const [currentWidth, setCurrentWidth] = useState<number | string>(width || 500);
  const [currentHeight, setCurrentHeight] = useState<number | string | null>(height || null);
  const [isAspectLocked, setIsAspectLocked] = useState<boolean>(!!aspectRatioLocked);
  const [currentZIndex, setCurrentZIndex] = useState<number>(zIndex || 1);

  // Drag Resizing State Ref
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(500);
  const startHeightRef = useRef(350);
  const aspectRatioRef = useRef(1.33);

  // Drag Rotation State Ref
  const isRotatingRef = useRef(false);

  // Keyboard Delete Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete node if not actively typing in an input
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          deleteNode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, deleteNode]);

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
    const numHeight = typeof currentHeight === 'number' ? currentHeight : img.clientHeight || 350;

    canvas.width = img.clientWidth || numWidth;
    canvas.height = img.clientHeight || numHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  }, [currentStrokes, activePoints, currentWidth, currentHeight, annotating, tool, strokeColor, strokeWidth]);

  // Pointer event handlers for drawing
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

  // ----------------------------------------------------
  // ROTATION HANDLE DRAGGING
  // ----------------------------------------------------
  const startRotateDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    isRotatingRef.current = true;
  };

  const handleRotateMove = (e: React.PointerEvent) => {
    if (!isRotatingRef.current || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const radians = Math.atan2(e.clientX - centerX, -(e.clientY - centerY));
    let deg = Math.round(radians * (180 / Math.PI));
    if (deg < 0) deg += 360;

    setCurrentRotation(deg);
  };

  const stopRotateDrag = (e: React.PointerEvent) => {
    if (!isRotatingRef.current) return;
    isRotatingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    updateAttributes({ rotation: currentRotation });
  };

  const handleQuickRotateClick = () => {
    const nextRot = (currentRotation + 45) % 360;
    setCurrentRotation(nextRot);
    updateAttributes({ rotation: nextRot });
  };

  // ----------------------------------------------------
  // POWERPOINT 8-HANDLE RESIZING LOGIC
  // ----------------------------------------------------
  const start8HandleResize = (
    e: React.PointerEvent,
    handle: 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    isResizingRef.current = true;
    resizeHandleRef.current = handle;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;

    const currentW = imgRef.current?.clientWidth || (typeof currentWidth === 'number' ? currentWidth : 500);
    const currentH = imgRef.current?.clientHeight || (typeof currentHeight === 'number' ? currentHeight : 350);

    startWidthRef.current = currentW;
    startHeightRef.current = currentH;
    aspectRatioRef.current = currentW / (currentH || 1);
  };

  const handle8HandleResizeMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current || !resizeHandleRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    const handle = resizeHandleRef.current;
    const shiftKey = e.shiftKey;

    let newW = startWidthRef.current;
    let newH = startHeightRef.current;

    // 1. INDEPENDENT SIDE RESIZING (Middle-Left & Middle-Right) -> ONLY WIDTH
    if (handle === 'mr') {
      newW = startWidthRef.current + deltaX;
      if (isAspectLocked && !shiftKey) {
        newH = Math.round(newW / aspectRatioRef.current);
      }
    } else if (handle === 'ml') {
      newW = startWidthRef.current - deltaX;
      if (isAspectLocked && !shiftKey) {
        newH = Math.round(newW / aspectRatioRef.current);
      }
    }

    // 2. INDEPENDENT VERTICAL RESIZING (Top-Center & Bottom-Center) -> ONLY HEIGHT
    else if (handle === 'bc') {
      newH = startHeightRef.current + deltaY;
      if (isAspectLocked && !shiftKey) {
        newW = Math.round(newH * aspectRatioRef.current);
      }
    } else if (handle === 'tc') {
      newH = startHeightRef.current - deltaY;
      if (isAspectLocked && !shiftKey) {
        newW = Math.round(newH * aspectRatioRef.current);
      }
    }

    // 3. CORNER RESIZING (Proportional by default unless Shift / Unlocked)
    else if (handle === 'br') {
      newW = startWidthRef.current + deltaX;
      newH = isAspectLocked || !shiftKey ? Math.round(newW / aspectRatioRef.current) : startHeightRef.current + deltaY;
    } else if (handle === 'bl') {
      newW = startWidthRef.current - deltaX;
      newH = isAspectLocked || !shiftKey ? Math.round(newW / aspectRatioRef.current) : startHeightRef.current + deltaY;
    } else if (handle === 'tr') {
      newW = startWidthRef.current + deltaX;
      newH = isAspectLocked || !shiftKey ? Math.round(newW / aspectRatioRef.current) : startHeightRef.current - deltaY;
    } else if (handle === 'tl') {
      newW = startWidthRef.current - deltaX;
      newH = isAspectLocked || !shiftKey ? Math.round(newW / aspectRatioRef.current) : startHeightRef.current - deltaY;
    }

    const clampedW = Math.max(100, Math.min(1800, Math.round(newW)));
    const clampedH = Math.max(80, Math.min(1600, Math.round(newH)));

    setCurrentWidth(clampedW);
    setCurrentHeight(clampedH);
  };

  const stop8HandleResize = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    resizeHandleRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    updateAttributes({
      width: currentWidth,
      height: currentHeight,
    });
  };

  const toggleAspectLock = () => {
    const nextState = !isAspectLocked;
    setIsAspectLocked(nextState);
    updateAttributes({ aspectRatioLocked: nextState });
  };

  const adjustZIndex = (delta: number) => {
    const nextZ = Math.max(1, currentZIndex + delta);
    setCurrentZIndex(nextZ);
    updateAttributes({ zIndex: nextZ });
  };

  const alignClasses = {
    left: 'mr-auto text-left',
    center: 'mx-auto text-center',
    right: 'ml-auto text-right',
  }[alignment as 'left' | 'center' | 'right'] || 'mx-auto text-center';

  const widthStyle = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;
  const heightStyle = currentHeight ? (typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight) : 'auto';

  return (
    <NodeViewWrapper className={`my-6 select-none group relative inline-block w-full ${alignClasses}`}>
      <div
        ref={containerRef}
        style={{
          width: widthStyle,
          height: heightStyle,
          transform: `rotate(${currentRotation}deg)`,
          zIndex: currentZIndex,
        }}
        className={`relative inline-block max-w-full rounded-xl overflow-visible transition-all ${
          selected
            ? 'ring-2 ring-brand-500 border-2 border-brand-500 shadow-2xl'
            : 'border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
        }`}
      >

        {/* --- ROTATION HANDLE ABOVE TOP-CENTER --- */}
        {selected && !locked && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 touch-none select-none">
            <button
              onPointerDown={startRotateDrag}
              onPointerMove={handleRotateMove}
              onPointerUp={stopRotateDrag}
              className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white text-white flex items-center justify-center shadow-lg hover:bg-brand-500 hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing transition-transform"
              title="Drag to Rotate Image Freely"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <div className="w-0.5 h-2.5 bg-brand-500" />
          </div>
        )}

        {/* Toolbar Header Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-30 text-xs shadow-xl">
          
          {/* Aspect Ratio Lock Toggle */}
          <button
            onClick={toggleAspectLock}
            className={`p-1 rounded-lg flex items-center gap-1 transition-colors ${
              isAspectLocked ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isAspectLocked ? 'Aspect Ratio Locked (Click to Unlock for Freeform Distortion)' : 'Aspect Ratio Unlocked'}
          >
            {isAspectLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{isAspectLocked ? 'Locked' : 'Freeform'}</span>
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Quick Rotate button */}
          <button
            onClick={handleQuickRotateClick}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Rotate 45°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Z-Index Layering */}
          <button
            onClick={() => adjustZIndex(1)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Bring Forward (Z-Index)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => adjustZIndex(-1)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Send Backward (Z-Index)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
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

          {/* Highlight / Annotate Mode */}
          <button
            onClick={() => setAnnotating(!annotating)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
              annotating ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-200'
            }`}
            title="Highlight / Draw on Image"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="text-[11px]">{annotating ? 'Done' : 'Highlight'}</span>
          </button>

          <span className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Fullscreen & Delete */}
          <button
            onClick={() => openFullscreen('image', resolvedSrc || src, title || alt || 'Image Preview')}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Full Screen View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={deleteNode}
            className="p-1 hover:bg-red-600 rounded-lg text-red-400 hover:text-white"
            title="Delete Image (Or press Delete key)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Rendered Image Element with Explicit Width & Height */}
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            ref={imgRef}
            src={resolvedSrc || src}
            alt={alt || ''}
            title={title || ''}
            style={{
              width: widthStyle,
              height: heightStyle,
              objectFit: isAspectLocked ? 'contain' : 'fill',
              display: 'block',
            }}
            className="rounded-xl transition-all"
            onError={async () => {
              if (storagePath) {
                const url = await resolveAssetUrl(storagePath);
                if (url && url !== resolvedSrc) setResolvedSrc(url);
              }
            }}
          />

          {/* Canvas Overlay for Annotations */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute inset-0 w-full h-full ${annotating ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
          />
        </div>

        {/* --- POWERPOINT-STYLE 8 RESIZE HANDLES --- */}
        {selected && !locked && (
          <>
            {/* 1. Top-Left Handle */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'tl')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -top-2 -left-2 w-4 h-4 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Resize"
            />

            {/* 2. Top-Center Handle (HEIGHT ONLY) */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'tc')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3.5 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-ns-resize hover:scale-125 transition-transform z-30 touch-none flex items-center justify-center"
              title="Drag Top/Bottom Edge to Change Height Only"
            >
              <div className="w-2.5 h-0.5 bg-white rounded-full" />
            </div>

            {/* 3. Top-Right Handle */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'tr')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -top-2 -right-2 w-4 h-4 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Resize"
            />

            {/* 4. Middle-Left Handle (WIDTH ONLY) */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'ml')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-6 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-ew-resize hover:scale-125 transition-transform z-30 touch-none flex items-center justify-center"
              title="Drag Left/Right Edge to Change Width Only"
            >
              <div className="w-0.5 h-2.5 bg-white rounded-full" />
            </div>

            {/* 5. Middle-Right Handle (WIDTH ONLY) */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'mr')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-6 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-ew-resize hover:scale-125 transition-transform z-30 touch-none flex items-center justify-center"
              title="Drag Left/Right Edge to Change Width Only"
            >
              <div className="w-0.5 h-2.5 bg-white rounded-full" />
            </div>

            {/* 6. Bottom-Left Handle */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'bl')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -bottom-2 -left-2 w-4 h-4 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Resize"
            />

            {/* 7. Bottom-Center Handle (HEIGHT ONLY) */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'bc')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3.5 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-ns-resize hover:scale-125 transition-transform z-30 touch-none flex items-center justify-center"
              title="Drag Top/Bottom Edge to Change Height Only"
            >
              <div className="w-2.5 h-0.5 bg-white rounded-full" />
            </div>

            {/* 8. Bottom-Right Handle */}
            <div
              onPointerDown={(e) => start8HandleResize(e, 'br')}
              onPointerMove={handle8HandleResizeMove}
              onPointerUp={stop8HandleResize}
              className="absolute -bottom-2 -right-2 w-4 h-4 rounded-sm bg-brand-600 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-30 touch-none"
              title="Drag Corner to Resize"
            />
          </>
        )}

      </div>
    </NodeViewWrapper>
  );
};
