import mongoose, { Schema, Document } from 'mongoose';

// 1. User Schema
export interface IUserDoc extends Document {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  targetExamYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  targetExamYear: { type: String, default: '2027' },
}, { timestamps: true });

// 2. Workspace Schema
export interface IWorkspaceDoc extends Document {
  id: string;
  userId: string;
  name: string;
  slug: string;
  icon: string;
  settings: string;
  position: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const WorkspaceSchema = new Schema<IWorkspaceDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  icon: { type: String, default: '🏛️' },
  settings: { type: Schema.Types.Mixed, default: {} },
  position: { type: String, default: 'a0' },
  version: { type: Number, default: 1 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 3. Notebook Schema
export interface INotebookDoc extends Document {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  position: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const NotebookSchema = new Schema<INotebookDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#6366f1' },
  position: { type: String, default: 'a0' },
  version: { type: Number, default: 1 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 4. Section Group Schema (GS I, GS II...)
export interface ISectionGroupDoc extends Document {
  id: string;
  userId: string;
  notebookId: string;
  name: string;
  position: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const SectionGroupSchema = new Schema<ISectionGroupDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  notebookId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  position: { type: String, default: 'a0' },
  version: { type: Number, default: 1 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 5. Subject Section Schema (Polity, History...)
export interface ISectionDoc extends Document {
  id: string;
  userId: string;
  notebookId: string;
  sectionGroupId?: string | null;
  name: string;
  icon: string;
  color: string;
  position: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const SectionSchema = new Schema<ISectionDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  notebookId: { type: String, required: true, index: true },
  sectionGroupId: { type: String, default: null, index: true },
  name: { type: String, required: true },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#6366f1' },
  position: { type: String, default: 'a0' },
  version: { type: Number, default: 1 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 6. Page Schema (Chapters & Topics)
export interface IPageDoc extends Document {
  id: string;
  userId: string;
  sectionId: string;
  parentId?: string | null;
  type: string;
  numbering?: string | null;
  title: string;
  icon: string;
  coverImage?: string | null;
  content: Schema.Types.Mixed;
  position: string;
  syllabusExam?: string | null;
  syllabusStage?: string | null;
  syllabusPaper?: string | null;
  syllabusSubject?: string | null;
  syllabusTopic?: string | null;
  isFavorite: boolean;
  isTemplate: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const PageSchema = new Schema<IPageDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  sectionId: { type: String, required: true, index: true },
  parentId: { type: String, default: null, index: true },
  type: { type: String, required: true, default: 'topic' },
  numbering: { type: String, default: null },
  title: { type: String, required: true },
  icon: { type: String, default: '📄' },
  coverImage: { type: String, default: null },
  content: { type: Schema.Types.Mixed, default: {} },
  position: { type: String, default: 'a0' },
  syllabusExam: { type: String, default: 'UPSC CSE' },
  syllabusStage: { type: String, default: null },
  syllabusPaper: { type: String, default: null },
  syllabusSubject: { type: String, default: null },
  syllabusTopic: { type: String, default: null },
  isFavorite: { type: Boolean, default: false },
  isTemplate: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 7. Attachment Schema
export interface IAttachmentDoc extends Document {
  id: string;
  userId: string;
  workspaceId: string;
  pageId?: string | null;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  mediaType: string;
  storageKey: string;
  storagePath: string;
  pageCount?: number | null;
  duration?: number | null;
  sha256Hash?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const AttachmentSchema = new Schema<IAttachmentDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  pageId: { type: String, default: null, index: true },
  originalFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mediaType: { type: String, required: true },
  storageKey: { type: String, required: true },
  storagePath: { type: String, required: true },
  pageCount: { type: Number, default: null },
  duration: { type: Number, default: null },
  sha256Hash: { type: String, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// 8. Tag Schema
export interface ITagDoc extends Document {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  color: string;
  isSystem: boolean;
  createdAt: Date;
}

const TagSchema = new Schema<ITagDoc>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  color: { type: String, default: '#6b7280' },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

// 9. PageTag Schema
export interface IPageTagDoc extends Document {
  userId: string;
  pageId: string;
  tagId: string;
  assignedAt: Date;
}

const PageTagSchema = new Schema<IPageTagDoc>({
  userId: { type: String, required: true, index: true },
  pageId: { type: String, required: true, index: true },
  tagId: { type: String, required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
});

// 10. Sync Change Change-Log Schema (For incremental cursor pull)
export interface ISyncChangeDoc extends Document {
  userId: string;
  cursor: number;
  operation: string; // CREATE | UPDATE | DELETE | RESTORE
  entityType: string; // WORKSPACE | NOTEBOOK | SECTION_GROUP | SECTION | PAGE | ATTACHMENT | TAG
  entityId: string;
  data: Schema.Types.Mixed;
  deviceId: string;
  timestamp: Date;
}

const SyncChangeSchema = new Schema<ISyncChangeDoc>({
  userId: { type: String, required: true, index: true },
  cursor: { type: Number, required: true, index: true },
  operation: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  deviceId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// 11. User Sync Cursor Counter Schema
export interface IUserCursorDoc extends Document {
  userId: string;
  currentCursor: number;
  lastSyncAt: Date;
}

const UserCursorSchema = new Schema<IUserCursorDoc>({
  userId: { type: String, required: true, unique: true, index: true },
  currentCursor: { type: Number, default: 0 },
  lastSyncAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUserDoc>('User', UserSchema);
export const WorkspaceModel = mongoose.model<IWorkspaceDoc>('Workspace', WorkspaceSchema);
export const NotebookModel = mongoose.model<INotebookDoc>('Notebook', NotebookSchema);
export const SectionGroupModel = mongoose.model<ISectionGroupDoc>('SectionGroup', SectionGroupSchema);
export const SectionModel = mongoose.model<ISectionDoc>('Section', SectionSchema);
export const PageModel = mongoose.model<IPageDoc>('Page', PageSchema);
export const AttachmentModel = mongoose.model<IAttachmentDoc>('Attachment', AttachmentSchema);
export const TagModel = mongoose.model<ITagDoc>('Tag', TagSchema);
export const PageTagModel = mongoose.model<IPageTagDoc>('PageTag', PageTagSchema);
export const SyncChangeModel = mongoose.model<ISyncChangeDoc>('SyncChange', SyncChangeSchema);
export const UserCursorModel = mongoose.model<IUserCursorDoc>('UserCursor', UserCursorSchema);
