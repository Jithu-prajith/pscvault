import { MediaType } from '../../domain/types';
import { generateUUIDv7 } from '../../lib/uuid';

let isTauriEnv = false;
try {
  isTauriEnv = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
} catch {
  isTauriEnv = false;
}

const MEDIA_TYPE_DIRS: Record<MediaType, string> = {
  image: 'attachments/images',
  pdf: 'attachments/pdfs',
  document: 'attachments/documents',
  audio: 'attachments/audio',
  video: 'attachments/video',
  drawing: 'attachments/drawings',
  archive: 'attachments/other',
  other: 'attachments/other',
};

export function classifyMediaType(mimeType: string): MediaType {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'text/markdown',
    ].includes(mimeType)
  ) {
    return 'document';
  }
  if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mimeType)) {
    return 'archive';
  }
  return 'other';
}

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export interface SavedFile {
  fileName: string;
  storagePath: string;
  absolutePath: string;
  assetUrl: string;
  sha256Hash: string;
}

// Memory blob cache for fast access
const blobUrlCache = new Map<string, string>();

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function saveAttachmentFile(
  data: Uint8Array,
  originalFileName: string,
  mediaType: MediaType
): Promise<SavedFile> {
  const dir = MEDIA_TYPE_DIRS[mediaType] || MEDIA_TYPE_DIRS.other;
  const ext = getExtension(originalFileName);
  const uuid = generateUUIDv7();
  const fileName = ext ? `${uuid}.${ext}` : uuid;
  const storagePath = `${dir}/${fileName}`;

  // Calculate SHA-256 Hash
  let sha256Hash = '';
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
    sha256Hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    console.warn('Hash generation warning:', e);
  }

  if (isTauriEnv) {
    try {
      const { writeFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const { appDataDir, join } = await import('@tauri-apps/api/path');
      const { convertFileSrc } = await import('@tauri-apps/api/core');

      if (!(await exists(dir, { baseDir: BaseDirectory.AppData }))) {
        await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
      }

      await writeFile(storagePath, data, { baseDir: BaseDirectory.AppData });
      const appData = await appDataDir();
      const absolutePath = await join(appData, storagePath);
      const assetUrl = convertFileSrc(absolutePath);

      return { fileName, storagePath, absolutePath, assetUrl, sha256Hash };
    } catch (e) {
      console.warn('Tauri FS write failed, falling back to persistent data URL:', e);
    }
  }

  // Browser Fallback: Convert Uint8Array to persistent Data URL (Base64)
  const mimeType = classifyMediaType(originalFileName);
  let mimeStr = 'application/octet-stream';
  if (mediaType === 'image') mimeStr = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/png';
  if (mediaType === 'pdf') mimeStr = 'application/pdf';
  if (mediaType === 'audio') mimeStr = ext ? `audio/${ext}` : 'audio/webm';

  const base64 = uint8ArrayToBase64(data);
  const assetUrl = `data:${mimeStr};base64,${base64}`;

  // Save to persistent browser storage
  try {
    const store = JSON.parse(localStorage.getItem('pscvault_attachment_blobs') || '{}');
    store[storagePath] = assetUrl;
    localStorage.setItem('pscvault_attachment_blobs', JSON.stringify(store));
  } catch (e) {
    console.warn('Attachment storage warn:', e);
  }

  blobUrlCache.set(storagePath, assetUrl);

  return {
    fileName,
    storagePath,
    absolutePath: storagePath,
    assetUrl,
    sha256Hash,
  };
}

export async function resolveAssetUrl(storagePath: string): Promise<string> {
  if (!storagePath) return '';
  if (
    storagePath.startsWith('data:') ||
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('blob:')
  ) {
    return storagePath;
  }

  if (blobUrlCache.has(storagePath)) {
    return blobUrlCache.get(storagePath)!;
  }

  // Check persistent localStorage blob store
  try {
    const store = JSON.parse(localStorage.getItem('pscvault_attachment_blobs') || '{}');
    if (store[storagePath]) {
      blobUrlCache.set(storagePath, store[storagePath]);
      return store[storagePath];
    }
  } catch (e) {
    console.warn('Failed reading attachment from localStorage:', e);
  }

  if (isTauriEnv) {
    try {
      const { appDataDir, join } = await import('@tauri-apps/api/path');
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      const appData = await appDataDir();
      const absolutePath = await join(appData, storagePath);
      return convertFileSrc(absolutePath);
    } catch (e) {
      console.warn('Tauri asset url resolution failed:', e);
    }
  }

  return storagePath;
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  if (blobUrlCache.has(storagePath)) {
    blobUrlCache.delete(storagePath);
  }

  try {
    const store = JSON.parse(localStorage.getItem('pscvault_attachment_blobs') || '{}');
    delete store[storagePath];
    localStorage.setItem('pscvault_attachment_blobs', JSON.stringify(store));
  } catch (e) {
    console.warn('Failed deleting attachment from localStorage:', e);
  }

  if (isTauriEnv) {
    try {
      const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await remove(storagePath, { baseDir: BaseDirectory.AppData });
    } catch (e) {
      console.warn('Failed to remove file from disk:', storagePath, e);
    }
  }
}
