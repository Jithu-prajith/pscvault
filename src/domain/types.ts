export type EntityId = string;

export type MediaType = 'image' | 'pdf' | 'document' | 'audio' | 'video' | 'drawing' | 'archive' | 'other';

export type PageEntityType = 'chapter' | 'topic' | 'page' | 'note' | 'conversation';

export interface User {
  id: EntityId;
  name: string;
  email: string | null;
  avatarPath: string | null;
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    fontSize?: number;
    defaultWorkspaceId?: string;
    onboardingCompleted?: boolean;
    targetExamYear?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: EntityId;
  userId: EntityId;
  name: string;
  slug: string;
  icon: string | null;
  settings: Record<string, any>;
  position: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Notebook {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  icon: string;
  color: string;
  position: string;
  isFavorite: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SectionGroup {
  id: EntityId;
  notebookId: EntityId;
  name: string;
  position: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Section {
  id: EntityId;
  notebookId: EntityId;
  sectionGroupId: EntityId | null;
  name: string;
  color: string;
  position: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PageSummary {
  id: EntityId;
  sectionId: EntityId;
  parentId: EntityId | null;
  type: PageEntityType;
  numbering: string | null; // "1" for chapter 1, "1.1" for topic 1.1
  title: string;
  icon: string | null;
  position: string;
  isFavorite: boolean;
  isTemplate: boolean;
  syllabusSubject: string | null;
  syllabusTopic: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page extends PageSummary {
  coverImage: string | null;
  content: object; // TipTap JSON document structure
  syllabusExam: string | null;
  syllabusStage: string | null;
  syllabusPaper: string | null;
  revisionStatus: number; // 0=New, 1=Learning, 2=Reviewed, 3=Strong, 4=Weak
  lastRevisedAt: string | null;
  nextRevisionAt: string | null;
  revisionCount: number;
  version: number;
  deletedAt: string | null;
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: EntityId;
  workspaceId: EntityId;
  pageId: EntityId | null;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  storagePath: string;
  sha256Hash: string | null;
  mediaType: MediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
  pageCount: number | null;
  thumbnailPath: string | null;
  extractedText: string | null;
  transcriptionText: string | null;
  metadata: Record<string, any>;
  syncStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Tag {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  color: string;
  isSystem: boolean;
  createdAt: string;
}

export interface PageRevision {
  id: EntityId;
  pageId: EntityId;
  version: number;
  title: string;
  contentSnapshot: object;
  changeSummary: string | null;
  createdAt: string;
}

export interface Template {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  category: string;
  description: string | null;
  content: object;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: EntityId;
  userId: EntityId;
  pageId: EntityId;
  label: string | null;
  createdAt: string;
}

export interface SearchResult {
  id: EntityId;
  pageId: EntityId;
  title: string;
  snippet: string;
  notebookName: string;
  sectionName: string;
  score?: number;
  updatedAt: string;
}

export interface StorageStats {
  totalSize: number;
  imageSize: number;
  pdfSize: number;
  documentSize: number;
  audioSize: number;
  videoSize: number;
  drawingSize: number;
  otherSize: number;
  databaseSize: number;
  attachmentCount: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  type: 'pen' | 'highlighter';
  points: StrokePoint[];
  color: string;
  width: number;
  opacity: number;
}
