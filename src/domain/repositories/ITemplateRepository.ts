import { Template, EntityId } from '../types';

export interface CreateTemplateDTO {
  workspaceId: EntityId;
  name: string;
  category?: string;
  description?: string;
  content: object;
  isSystem?: boolean;
}

export interface ITemplateRepository {
  getAll(workspaceId: EntityId, category?: string): Promise<Template[]>;
  getById(id: EntityId): Promise<Template | null>;
  create(dto: CreateTemplateDTO): Promise<Template>;
  delete(id: EntityId): Promise<void>;
}
