import { Workspace, EntityId } from '../types';

export interface CreateWorkspaceDTO {
  userId: EntityId;
  name: string;
  slug?: string;
  icon?: string;
}

export interface IWorkspaceRepository {
  getAll(userId: EntityId): Promise<Workspace[]>;
  getById(id: EntityId): Promise<Workspace | null>;
  create(data: CreateWorkspaceDTO): Promise<Workspace>;
  update(id: EntityId, data: Partial<Pick<Workspace, 'name' | 'icon' | 'settings'>>): Promise<Workspace>;
  softDelete(id: EntityId): Promise<void>;
  restore(id: EntityId): Promise<void>;
}
