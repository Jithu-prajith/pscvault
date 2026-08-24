import { db } from '../db/drizzle';
import { sections, sectionGroups } from '../db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { ISectionRepository, CreateSectionDTO } from '../../domain/repositories/ISectionRepository';
import { Section, SectionGroup } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export class LocalSectionRepository implements ISectionRepository {
  async getByNotebook(notebookId: string): Promise<Section[]> {
    return db.select().from(sections).where(
      and(eq(sections.notebookId, notebookId), isNull(sections.deletedAt))
    ).orderBy(asc(sections.position));
  }

  async getGroupsByNotebook(notebookId: string): Promise<SectionGroup[]> {
    return db.select().from(sectionGroups).where(
      and(eq(sectionGroups.notebookId, notebookId), isNull(sectionGroups.deletedAt))
    ).orderBy(asc(sectionGroups.position));
  }

  async getById(id: string): Promise<Section | null> {
    const rows = await db.select().from(sections).where(eq(sections.id, id));
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data: CreateSectionDTO): Promise<Section> {
    const now = nowISO();
    const id = generateUUIDv7();
    const newSection: Section = {
      id,
      notebookId: data.notebookId,
      sectionGroupId: data.sectionGroupId || null,
      name: data.name,
      color: data.color || '#6366f1',
      position: 'a0',
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(sections).values(newSection);
    return newSection;
  }

  async createGroup(data: string | { notebookId: string; name: string; position?: string }, name?: string): Promise<SectionGroup> {
    const now = nowISO();
    const id = generateUUIDv7();
    const notebookId = typeof data === 'string' ? data : data.notebookId;
    const grpName = typeof data === 'string' ? (name || 'New Group') : data.name;
    const position = typeof data === 'object' && data.position ? data.position : 'a0';

    const newGrp: SectionGroup = {
      id,
      notebookId,
      name: grpName,
      position,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(sectionGroups).values(newGrp);
    return newGrp;
  }

  async update(id: string, data: Partial<Pick<Section, 'name' | 'color' | 'sectionGroupId'>>): Promise<Section> {
    const now = nowISO();
    await db.update(sections).set({ ...data, updatedAt: now }).where(eq(sections.id, id));
    const updated = await this.getById(id);
    return updated!;
  }

  async softDelete(id: string): Promise<void> {
    await db.update(sections).set({ deletedAt: nowISO() }).where(eq(sections.id, id));
  }

  async restore(id: string): Promise<void> {
    await db.update(sections).set({ deletedAt: null }).where(eq(sections.id, id));
  }

  async reorder(id: string, newPosition: string): Promise<void> {
    await db.update(sections).set({ position: newPosition, updatedAt: nowISO() }).where(eq(sections.id, id));
  }

  async move(id: string, targetNotebookId: string): Promise<void> {
    await db.update(sections).set({ notebookId: targetNotebookId, updatedAt: nowISO() }).where(eq(sections.id, id));
  }
}
