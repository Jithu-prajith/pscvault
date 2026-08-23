import { MediaType } from '../../domain/types';
import { classifyMediaType, getExtension } from './fileService';

const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 50 * 1024 * 1024,      // 50 MB
  pdf: 200 * 1024 * 1024,      // 200 MB
  document: 100 * 1024 * 1024, // 100 MB
  audio: 500 * 1024 * 1024,    // 500 MB
  video: 2 * 1024 * 1024 * 1024, // 2 GB
  drawing: 10 * 1024 * 1024,   // 10 MB
  archive: 500 * 1024 * 1024,  // 500 MB
  other: 100 * 1024 * 1024,    // 100 MB
};

const ALLOWED_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp',
  // PDFs
  'pdf',
  // Documents
  'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'md', 'rtf',
  // Audio
  'mp3', 'wav', 'ogg', 'webm', 'aac', 'flac', 'm4a',
  // Video
  'mp4', 'webm', 'mov', 'avi', 'mkv',
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz',
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachment(fileName: string, fileSize: number, mimeType: string): ValidationResult {
  const ext = getExtension(fileName).toLowerCase();
  const mediaType = classifyMediaType(mimeType);

  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File extension ".${ext}" is not supported.` };
  }

  const maxSize = MAX_FILE_SIZES[mediaType];
  if (fileSize > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum allowed size of ${maxMB} MB.` };
  }

  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { valid: false, error: 'Invalid file path or name.' };
  }

  return { valid: true };
}
