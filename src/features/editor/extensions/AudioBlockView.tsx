import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Play, Pause, Mic, Square, Trash2, Edit2, FileText, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { formatDuration, formatBytes } from '../../../lib/utils';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useAttachmentRepo } from '../../../infrastructure/RepositoryProvider';
import { usePageStore } from '../../../stores/pageStore';

export const AudioBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, fileName, fileSize, duration: initialDuration, isRecordingMode, attachmentId } = node.attrs;
  const attachmentRepo = useAttachmentRepo();
  const currentPage = usePageStore((s) => s.currentPage);
  const addAttachment = usePageStore((s) => s.addAttachment);

  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(initialDuration || 0);
  const [audioSrc, setAudioSrc] = useState<string | null>(src);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(fileName || 'Voice Recording');

  const { state: recordState, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecorder();

  // Initialize WaveSurfer player if audio source exists
  useEffect(() => {
    if (!audioSrc || !containerRef.current || isRecordingMode) return;

    try {
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#94a3b8',
        progressColor: '#6366f1',
        cursorColor: '#4f46e5',
        cursorWidth: 2,
        barWidth: 3,
        barGap: 2,
        barRadius: 2,
        height: 48,
        normalize: true,
        url: audioSrc,
      });

      wavesurferRef.current = ws;

      ws.on('play', () => setIsPlaying(true));
      ws.on('pause', () => setIsPlaying(false));
      ws.on('timeupdate', (t) => setCurrentTime(t));
      ws.on('ready', (d) => {
        setDuration(d);
        updateAttributes({ duration: d });
      });
      ws.on('finish', () => setIsPlaying(false));

      return () => {
        ws.destroy();
      };
    } catch (e) {
      console.warn('WaveSurfer init error:', e);
    }
  }, [audioSrc, isRecordingMode]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleStopRecording = async () => {
    const res = await stopRecording();
    if (!res || !currentPage) return;

    const data = new Uint8Array(await res.blob.arrayBuffer());
    const name = `Recording_${new Date().toISOString().slice(0,10)}.${res.extension}`;

    const attachment = await attachmentRepo.save({
      workspaceId: currentPage.sectionId, // workspace scope resolved
      pageId: currentPage.id,
      originalFileName: name,
      mimeType: res.mimeType,
      fileData: data,
      duration: res.duration,
    });

    addAttachment(attachment);
    const assetUrl = await attachmentRepo.getAssetUrl(attachment);

    setAudioSrc(assetUrl);
    setTitle(name);
    setDuration(res.duration);
    updateAttributes({
      src: assetUrl,
      fileName: name,
      fileSize: data.byteLength,
      duration: res.duration,
      attachmentId: attachment.id,
      isRecordingMode: false,
    });
  };

  return (
    <NodeViewWrapper className="my-4 select-none">
      <div className={`p-4 bg-slate-900 text-white rounded-xl border transition-all ${selected ? 'ring-2 ring-brand-500 border-brand-500 shadow-md' : 'border-slate-800 shadow-sm hover:border-slate-700'}`}>
        
        {/* Case 1: Active In-Page Recording UI */}
        {isRecordingMode && recordState.isRecording ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div>
                <h4 className="font-semibold text-sm text-red-400">Recording Voice Note...</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{formatDuration(recordState.duration)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recordState.isPaused ? (
                <button
                  onClick={resumeRecording}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg"
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop & Save</span>
              </button>
            </div>
          </div>
        ) : isRecordingMode ? (
          /* Initial Idle Recording Trigger */
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-slate-200">Record Voice Explanation</span>
            </div>
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Recording</span>
            </button>
          </div>
        ) : (
          /* Case 2: Audio Playback Waveform Player */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-brand-400 shrink-0" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      setIsEditingTitle(false);
                      updateAttributes({ fileName: title });
                    }}
                    className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h4
                    onClick={() => setIsEditingTitle(true)}
                    className="font-medium text-slate-100 text-sm truncate max-w-[280px] cursor-pointer hover:underline"
                    title="Click to rename"
                  >
                    {title}
                  </h4>
                )}
                <button onClick={() => setIsEditingTitle(true)} className="text-slate-500 hover:text-slate-300">
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
              </div>
            </div>

            {/* Waveform Container */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shrink-0 transition-colors shadow"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              
              <div ref={containerRef} className="flex-1 cursor-pointer" />
            </div>

            {/* Sub-actions */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>{formatBytes(fileSize || 0)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-500 rounded text-[11px] cursor-not-allowed"
                  title="Transcribe (Phase 4)"
                >
                  <FileText className="w-3 h-3 text-brand-400/50" />
                  <span>Transcribe</span>
                </button>
                <button
                  onClick={deleteNode}
                  className="p-1 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded transition-colors"
                  title="Delete Recording"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
