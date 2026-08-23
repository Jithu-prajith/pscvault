import { Notebook, EntityId } from '../types';

export interface CreateNotebookDTO {
  workspaceId: EntityId;
  name: string;
  icon?: string;
  color?: string;
}

export interface INotebookRepository {
  getAll(workspaceId: EntityId): Promise<Notebook[]>;
  getById(id: EntityId): Promise<Notebook | null>;
  create(data: CreateNotebookDTO): Promise<Notebook>;
  update(id: EntityId, data: Partial<Pick<Notebook, 'name' | 'icon' | 'color'>>): Promise<Notebook>;
  softDelete(id: EntityId): Promise<void>;
  restore(id: EntityId): Promise<void>;
  permanentDelete(id: EntityId): Promise<void>;
  reorder(id: EntityId, newPosition: string): Promise<void>;
  duplicate(id: EntityId): Promise<Notebook>;
  toggleFavorite(id: EntityId): Promise<boolean>;
}
