import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Highlighter, Eraser, RotateCcw, RotateCw, Check, Palette } from 'lucide-react';
import { DrawingStroke, StrokePoint } from '../../domain/types';

interface DrawingCanvasProps {
  initialStrokes?: DrawingStroke[];
  onSaveStrokes: (strokes: DrawingStroke[]) => void;
  active: boolean;
  onClose: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  initialStrokes = [],
  onSaveStrokes,
  active,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#6366f1'); // Default brand purple pen
  const [width, setWidth] = useState(4);
  const [opacity, setOpacity] = useState(1.0);

  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialStrokes);
  const [redoStack, setRedoStack] = useState<DrawingStroke[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);

  useEffect(() => {
    setStrokes(initialStrokes);
  }, [initialStrokes]);

  // Adjust tool defaults
  useEffect(() => {
    if (tool === 'highlighter') {
      setColor('#fde047'); // Yellow
      setWidth(18);
      setOpacity(0.45);
    } else if (tool === 'pen') {
      setColor('#6366f1');
      setWidth(4);
      setOpacity(1.0);
    } else if (tool === 'eraser') {
      setWidth(24);
    }
  }, [tool]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match viewport container
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    strokes.forEach((stroke) => {
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

    // Draw current active stroke
    if (currentPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = opacity;

      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentPoints, tool, color, width, opacity]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Extract pressure for S-Pen / Stylus pointer input
    const pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;

    setCurrentPoints([{ x, y, pressure }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !active) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;

    setCurrentPoints((prev) => [...prev, { x, y, pressure }]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !active) return;
    setIsDrawing(false);

    if (currentPoints.length > 1) {
      const newStroke: DrawingStroke = {
        id: `stroke_${Date.now()}`,
        type: tool === 'highlighter' ? 'highlighter' : 'pen',
        points: currentPoints,
        color: tool === 'eraser' ? '#ffffff' : color,
        width: width,
        opacity: opacity,
      };

      const updated = [...strokes, newStroke];
      setStrokes(updated);
      setRedoStack([]);
      onSaveStrokes(updated);
    }

    setCurrentPoints([]);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const remaining = strokes.slice(0, strokes.length - 1);
    setStrokes(remaining);
    setRedoStack((prev) => [last, ...prev]);
    onSaveStrokes(remaining);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const first = redoStack[0];
    const remaining = redoStack.slice(1);
    const updated = [...strokes, first];
    setStrokes(updated);
    setRedoStack(remaining);
    onSaveStrokes(updated);
  };

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col">
      {/* Floating Drawing Toolbar */}
      <div className="pointer-events-auto self-center mt-3 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-2xl border border-slate-800 shadow-2xl z-40 select-none">
        
        {/* Tool Selectors */}
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${
            tool === 'pen' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Pen</span>
        </button>

        <button
          onClick={() => setTool('highlighter')}
          className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${
            tool === 'highlighter' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Highlighter className="w-4 h-4" />
          <span>Highlighter</span>
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${
            tool === 'eraser' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Eraser className="w-4 h-4" />
          <span>Eraser</span>
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        {/* Color Palette Swatches */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1.5">
            {[
              '#6366f1', '#3b82f6', '#10b981', '#ef4444',
              '#fde047', '#f472b6', '#000000', '#ffffff'
            ].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border border-white/20 transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        <span className="w-px h-4 bg-slate-700 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300"
          title="Undo Stroke"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300"
          title="Redo Stroke"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        {/* Exit Drawing Mode */}
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>Done</span>
        </button>
      </div>

      {/* Canvas Interactive Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="pointer-events-auto flex-1 w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};
