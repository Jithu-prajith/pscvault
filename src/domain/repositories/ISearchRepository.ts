import { SearchResult, EntityId } from '../types';

export interface ISearchRepository {
  search(workspaceId: EntityId, query: string): Promise<SearchResult[]>;
  indexPage(pageId: EntityId, title: string, contentText: string, tagsText: string): Promise<void>;
  removePage(pageId: EntityId): Promise<void>;
  reindexAll(workspaceId: EntityId): Promise<void>;
}
