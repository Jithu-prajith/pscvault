import { PageRevision, EntityId } from '../types';

export interface IRevisionRepository {
  getRevisions(pageId: EntityId): Promise<PageRevision[]>;
  getRevision(revisionId: EntityId): Promise<PageRevision | null>;
  createRevision(pageId: EntityId, title: string, contentSnapshot: object, summary?: string): Promise<PageRevision>;
  restoreRevision(revisionId: EntityId): Promise<object>;
}
