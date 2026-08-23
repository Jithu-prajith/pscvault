import { Page, PageSummary, EntityId, PageEntityType } from '../types';

export interface CreatePageDTO {
  sectionId: EntityId;
  parentId?: EntityId | null;
  type?: PageEntityType;
  numbering?: string | null;
  title?: string;
  icon?: string;
  content?: object;
  syllabusExam?: string;
  syllabusStage?: string;
  syllabusPaper?: string;
  syllabusSubject?: string;
  syllabusTopic?: string;
}

export interface UpdatePageDTO {
  title?: string;
  icon?: string | null;
  coverImage?: string | null;
  content?: object;
  syllabusExam?: string | null;
  syllabusStage?: string | null;
  syllabusPaper?: string | null;
  syllabusSubject?: string | null;
  syllabusTopic?: string | null;
  revisionStatus?: number;
}

export interface IPageRepository {
  getBySection(sectionId: EntityId): Promise<PageSummary[]>;
  getSubpages(parentId: EntityId): Promise<PageSummary[]>;
  getById(id: EntityId): Promise<Page | null>;
  create(data: CreatePageDTO): Promise<Page>;
  createChapter(sectionId: EntityId, title?: string): Promise<Page>;
  createTopic(chapterId: EntityId, title?: string): Promise<Page>;
  update(id: EntityId, data: UpdatePageDTO): Promise<Page>;
  updateContent(id: EntityId, content: object): Promise<{ version: number }>;
  softDelete(id: EntityId): Promise<void>;
  restore(id: EntityId): Promise<void>;
  permanentDelete(id: EntityId): Promise<void>;
  reorder(id: EntityId, newPosition: string): Promise<void>;
  move(id: EntityId, targetSectionId: EntityId): Promise<void>;
  duplicate(id: EntityId): Promise<Page>;
  toggleFavorite(id: EntityId): Promise<boolean>;
  getFavorites(workspaceId: EntityId): Promise<PageSummary[]>;
  getRecent(workspaceId: EntityId, limit?: number): Promise<PageSummary[]>;
  getByTag(tagId: EntityId): Promise<PageSummary[]>;
  getDeleted(workspaceId: EntityId): Promise<PageSummary[]>;
}
