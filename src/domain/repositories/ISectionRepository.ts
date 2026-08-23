import { Section, SectionGroup, EntityId } from '../types';

export interface CreateSectionDTO {
  notebookId: EntityId;
  sectionGroupId?: EntityId | null;
  name: string;
  color?: string;
}

export interface ISectionRepository {
  getByNotebook(notebookId: EntityId): Promise<Section[]>;
  getGroupsByNotebook(notebookId: EntityId): Promise<SectionGroup[]>;
  getById(id: EntityId): Promise<Section | null>;
  create(data: CreateSectionDTO): Promise<Section>;
  createGroup(notebookId: EntityId, name: string): Promise<SectionGroup>;
  update(id: EntityId, data: Partial<Pick<Section, 'name' | 'color' | 'sectionGroupId'>>): Promise<Section>;
  softDelete(id: EntityId): Promise<void>;
  restore(id: EntityId): Promise<void>;
  reorder(id: EntityId, newPosition: string): Promise<void>;
  move(id: EntityId, targetNotebookId: EntityId): Promise<void>;
}
