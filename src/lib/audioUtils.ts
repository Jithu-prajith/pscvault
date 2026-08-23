export interface SupportedAudioFormat {
  mimeType: string;
  extension: string;
}

export function getSupportedAudioFormat(): SupportedAudioFormat {
  const candidates: SupportedAudioFormat[] = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'mp4' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate.mimeType)) {
      return candidate;
    }
  }

  return { mimeType: 'audio/webm', extension: 'webm' };
}

export async function getExactAudioDuration(blob: Blob): Promise<number> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    await audioContext.close();
    return duration;
  } catch (e) {
    console.warn('Could not decode audio duration via AudioContext:', e);
    return 0;
  }
}
