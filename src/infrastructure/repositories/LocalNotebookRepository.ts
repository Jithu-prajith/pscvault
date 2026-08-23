import { db } from '../db/drizzle';
import { notebooks } from '../db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { INotebookRepository, CreateNotebookDTO } from '../../domain/repositories/INotebookRepository';
import { Notebook } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export class LocalNotebookRepository implements INotebookRepository {
  async getAll(workspaceId: string): Promise<Notebook[]> {
    return db.select().from(notebooks).where(
      and(eq(notebooks.workspaceId, workspaceId), isNull(notebooks.deletedAt))
    ).orderBy(asc(notebooks.position));
  }

  async getById(id: string): Promise<Notebook | null> {
    const rows = await db.select().from(notebooks).where(eq(notebooks.id, id));
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data: CreateNotebookDTO): Promise<Notebook> {
    const now = nowISO();
    const id = generateUUIDv7();
    const newNb: Notebook = {
      id,
      workspaceId: data.workspaceId,
      name: data.name,
      icon: data.icon || '📓',
      color: data.color || '#6366f1',
      position: 'a0',
      isFavorite: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(notebooks).values(newNb);
    return newNb;
  }

  async update(id: string, data: Partial<Pick<Notebook, 'name' | 'icon' | 'color'>>): Promise<Notebook> {
    const now = nowISO();
    await db.update(notebooks).set({ ...data, updatedAt: now }).where(eq(notebooks.id, id));
    const updated = await this.getById(id);
    return updated!;
  }

  async softDelete(id: string): Promise<void> {
    await db.update(notebooks).set({ deletedAt: nowISO() }).where(eq(notebooks.id, id));
  }

  async restore(id: string): Promise<void> {
    await db.update(notebooks).set({ deletedAt: null }).where(eq(notebooks.id, id));
  }

  async permanentDelete(id: string): Promise<void> {
    await db.delete(notebooks).where(eq(notebooks.id, id));
  }

  async reorder(id: string, newPosition: string): Promise<void> {
    await db.update(notebooks).set({ position: newPosition, updatedAt: nowISO() }).where(eq(notebooks.id, id));
  }

  async duplicate(id: string): Promise<Notebook> {
    const source = await this.getById(id);
    if (!source) throw new Error('Notebook not found');
    return this.create({
      workspaceId: source.workspaceId,
      name: `${source.name} (Copy)`,
      icon: source.icon,
      color: source.color,
    });
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const nb = await this.getById(id);
    if (!nb) return false;
    const nextState = !nb.isFavorite;
    await db.update(notebooks).set({ isFavorite: nextState, updatedAt: nowISO() }).where(eq(notebooks.id, id));
    return nextState;
  }
}
