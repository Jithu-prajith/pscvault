import { Tag, EntityId } from '../types';

export interface CreateTagDTO {
  workspaceId: EntityId;
  name: string;
  color?: string;
  isSystem?: boolean;
}

export interface ITagRepository {
  getAll(workspaceId: EntityId): Promise<Tag[]>;
  getById(id: EntityId): Promise<Tag | null>;
  create(dto: CreateTagDTO): Promise<Tag>;
  update(id: EntityId, data: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag>;
  delete(id: EntityId): Promise<void>;
  assignToPage(pageId: EntityId, tagId: EntityId): Promise<void>;
  removeFromPage(pageId: EntityId, tagId: EntityId): Promise<void>;
  getPageTags(pageId: EntityId): Promise<Tag[]>;
}
