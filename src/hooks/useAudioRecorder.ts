import { useState, useRef, useCallback } from 'react';
import { getSupportedAudioFormat, getExactAudioDuration } from '../lib/audioUtils';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export interface AudioRecorderResult {
  blob: Blob;
  duration: number;
  mimeType: string;
  extension: string;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const formatRef = useRef({ mimeType: 'audio/webm', extension: 'webm' });

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const format = getSupportedAudioFormat();
      formatRef.current = format;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: format.mimeType || undefined,
        audioBitsPerSecond: 32000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, duration: (Date.now() - startTimeRef.current) / 1000 }));
      }, 100);

      setState({ isRecording: true, isPaused: false, duration: 0, error: null });
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Microphone access failed' }));
    }
  }, []);

  const stopRecording = useCallback((): Promise<AudioRecorderResult> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;

      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: formatRef.current.mimeType });
        let exactDuration = await getExactAudioDuration(blob);
        if (!exactDuration || exactDuration <= 0) {
          exactDuration = (Date.now() - startTimeRef.current) / 1000;
        }

        setState({ isRecording: false, isPaused: false, duration: 0, error: null });

        resolve({
          blob,
          duration: exactDuration,
          mimeType: formatRef.current.mimeType,
          extension: formatRef.current.extension,
        });
      };

      recorder.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  return { state, startRecording, stopRecording, pauseRecording, resumeRecording };
}
