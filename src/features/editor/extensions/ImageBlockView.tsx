import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
  RotateCw, Maximize2, Trash2, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Edit3, Crop, Lock, Unlock, ArrowUp, ArrowDown, Copy
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { DrawingStroke, StrokePoint } from '../../../domain/types';

export const ImageBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, alt, title, width, rotation, alignment, zIndex, locked, annotations } = node.attrs;
  const openFullscreen = useUIStore((s) => s.openFullscreenViewer);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mode states
  const [annotating, setAnnotating] = useState(false);
  const [tool, setTool] = useState<'highlighter' | 'pen' | 'eraser'>('highlighter');
  const [strokeColor, setStrokeColor] = useState('#fde047'); // Yellow highlighter default
  const [strokeWidth, setStrokeWidth] = useState(16); // Thicker for highlighter

  const [currentStrokes, setCurrentStrokes] = useState<DrawingStroke[]>(annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePoints, setActivePoints] = useState<StrokePoint[]>([]);

  const [currentRotation, setCurrentRotation] = useState<number>(rotation || 0);
  const [currentWidth, setCurrentWidth] = useState<number>(width || 500);

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

    canvas.width = img.clientWidth || currentWidth;
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

  // Rotation Handle Drag
  const handleRotateClick = () => {
    const nextRot = (currentRotation + 45) % 360;
    setCurrentRotation(nextRot);
    updateAttributes({ rotation: nextRot });
  };

  // Corner Resize Handler
  const handleCornerResize = (e: React.MouseEvent, factor: number) => {
    e.stopPropagation();
    const newW = Math.max(200, Math.min(1200, currentWidth + factor));
    setCurrentWidth(newW);
    updateAttributes({ width: newW });
  };

  const alignClasses = {
    left: 'mr-auto text-left',
    center: 'mx-auto text-center',
    right: 'ml-auto text-right',
  }[alignment as 'left' | 'center' | 'right'] || 'mx-auto text-center';

  return (
    <NodeViewWrapper className={`my-6 select-none group relative inline-block w-full ${alignClasses}`}>
      <div
        ref={containerRef}
        style={{
          width: `${currentWidth}px`,
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

        {/* Toolbar Header (Selection / Annotation Mode Controls) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-30 text-xs shadow-lg">
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
            onClick={() => openFullscreen('image', src, title || alt || 'Image Preview')}
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
            src={src}
            alt={alt || ''}
            title={title || ''}
            style={{ width: `${currentWidth}px`, height: 'auto', display: 'block' }}
            className="rounded-2xl object-contain"
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

        {/* Corner Resize Handles when Selected */}
        {selected && !locked && (
          <>
            <button
              onMouseDown={(e) => handleCornerResize(e, 50)}
              className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow cursor-se-resize z-30"
              title="Resize Image"
            />
            <button
              onMouseDown={(e) => handleCornerResize(e, -50)}
              className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow cursor-sw-resize z-30"
              title="Shrink Image"
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
