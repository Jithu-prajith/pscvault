import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  avatarPath: text('avatar_path'),
  preferences: text('preferences').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  icon: text('icon'),
  settings: text('settings').notNull().default('{}'),
  position: text('position').notNull().default('a0'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  uniqueIndex('idx_workspaces_slug').on(table.slug),
  index('idx_workspaces_user').on(table.userId, table.deletedAt),
]);

export const notebooks = sqliteTable('notebooks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📓'),
  color: text('color').notNull().default('#6366f1'),
  position: text('position').notNull().default('a0'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_notebooks_ws').on(table.workspaceId, table.deletedAt),
  index('idx_notebooks_pos').on(table.position),
]);

export const sectionGroups = sqliteTable('section_groups', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: text('position').notNull().default('a0'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_secgrp_nb').on(table.notebookId, table.deletedAt),
]);

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  notebookId: text('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  sectionGroupId: text('section_group_id').references(() => sectionGroups.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  position: text('position').notNull().default('a0'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_sections_nb').on(table.notebookId, table.deletedAt),
  index('idx_sections_grp').on(table.sectionGroupId),
  index('idx_sections_pos').on(table.position),
]);

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  type: text('type').notNull().default('page'),
  numbering: text('numbering'),
  title: text('title').notNull().default('Untitled'),
  icon: text('icon'),
  coverImage: text('cover_image'),
  content: text('content').notNull().default('{}'),
  position: text('position').notNull().default('a0'),
  syllabusExam: text('syllabus_exam'),
  syllabusStage: text('syllabus_stage'),
  syllabusPaper: text('syllabus_paper'),
  syllabusSubject: text('syllabus_subject'),
  syllabusTopic: text('syllabus_topic'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
  revisionStatus: integer('revision_status').notNull().default(0),
  lastRevisedAt: text('last_revised_at'),
  nextRevisionAt: text('next_revision_at'),
  revisionCount: integer('revision_count').notNull().default(0),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_pages_section').on(table.sectionId, table.deletedAt),
  index('idx_pages_parent').on(table.parentId),
  index('idx_pages_pos').on(table.position),
  index('idx_pages_fav').on(table.isFavorite),
  index('idx_pages_revision').on(table.revisionStatus, table.nextRevisionAt),
  index('idx_pages_updated').on(table.updatedAt),
]);

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  pageId: text('page_id').references(() => pages.id, { onDelete: 'set null' }),
  fileName: text('file_name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileExtension: text('file_extension').notNull(),
  fileSize: integer('file_size').notNull(),
  storagePath: text('storage_path').notNull(),
  sha256Hash: text('sha256_hash'),
  mediaType: text('media_type').notNull().default('other'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  pageCount: integer('page_count'),
  thumbnailPath: text('thumbnail_path'),
  extractedText: text('extracted_text'),
  transcriptionText: text('transcription_text'),
  metadata: text('metadata').notNull().default('{}'),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
  version: integer('version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_attach_ws').on(table.workspaceId, table.deletedAt),
  index('idx_attach_page').on(table.pageId),
  index('idx_attach_media').on(table.mediaType),
  index('idx_attach_hash').on(table.sha256Hash),
]);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_tags_unique').on(table.workspaceId, table.name),
  index('idx_tags_ws').on(table.workspaceId),
]);

export const pageTags = sqliteTable('page_tags', {
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.pageId, table.tagId] }),
  index('idx_pagetags_tag').on(table.tagId),
]);

export const pageRevisions = sqliteTable('page_revisions', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  contentSnapshot: text('content_snapshot').notNull(),
  changeSummary: text('change_summary'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_pagerev_unique').on(table.pageId, table.version),
  index('idx_pagerev_page').on(table.pageId, table.createdAt),
]);

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  description: text('description'),
  content: text('content').notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_templates_ws').on(table.workspaceId, table.category),
]);

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  label: text('label'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_bookmark_unique').on(table.userId, table.pageId),
]);

export const syncOutbox = sqliteTable('sync_outbox', {
  mutationId: text('mutation_id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(),
  payload: text('payload').notNull(),
  clientTimestamp: integer('client_timestamp').notNull(),
  status: text('status').notNull().default('PENDING'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
});
