import { db } from '../db/drizzle';
import { templates } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ITemplateRepository, CreateTemplateDTO } from '../../domain/repositories/ITemplateRepository';
import { Template } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export class LocalTemplateRepository implements ITemplateRepository {
  async getAll(workspaceId: string, category?: string): Promise<Template[]> {
    const conditions = [eq(templates.workspaceId, workspaceId)];
    if (category) conditions.push(eq(templates.category, category));
    
    const rows = await db.select().from(templates).where(and(...conditions));
    return rows.map(r => ({
      ...r,
      content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content,
    }));
  }

  async getById(id: string): Promise<Template | null> {
    const rows = await db.select().from(templates).where(eq(templates.id, id));
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content,
    };
  }

  async create(dto: CreateTemplateDTO): Promise<Template> {
    const now = nowISO();
    const id = generateUUIDv7();
    const newRecord = {
      id,
      workspaceId: dto.workspaceId,
      name: dto.name,
      category: dto.category || 'general',
      description: dto.description || null,
      content: JSON.stringify(dto.content),
      isSystem: dto.isSystem || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(templates).values(newRecord);
    return { ...newRecord, content: dto.content };
  }

  async delete(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
}
