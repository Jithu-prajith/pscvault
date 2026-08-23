import { db } from '../db/drizzle';
import { tags, pageTags } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ITagRepository, CreateTagDTO } from '../../domain/repositories/ITagRepository';
import { Tag } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export class LocalTagRepository implements ITagRepository {
  async getAll(workspaceId: string): Promise<Tag[]> {
    return db.select().from(tags).where(eq(tags.workspaceId, workspaceId));
  }

  async getById(id: string): Promise<Tag | null> {
    const rows = await db.select().from(tags).where(eq(tags.id, id));
    return rows.length > 0 ? rows[0] : null;
  }

  async create(dto: CreateTagDTO): Promise<Tag> {
    const now = nowISO();
    const id = generateUUIDv7();
    const newTag: Tag = {
      id,
      workspaceId: dto.workspaceId,
      name: dto.name,
      color: dto.color || '#6b7280',
      isSystem: dto.isSystem || false,
      createdAt: now,
    };

    await db.insert(tags).values(newTag);
    return newTag;
  }

  async update(id: string, data: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag> {
    await db.update(tags).set(data).where(eq(tags.id, id));
    const updated = await this.getById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }

  async assignToPage(pageId: string, tagId: string): Promise<void> {
    const now = nowISO();
    try {
      await db.insert(pageTags).values({ pageId, tagId, assignedAt: now });
    } catch {
      // Already assigned
    }
  }

  async removeFromPage(pageId: string, tagId: string): Promise<void> {
    await db.delete(pageTags).where(
      and(eq(pageTags.pageId, pageId), eq(pageTags.tagId, tagId))
    );
  }

  async getPageTags(pageId: string): Promise<Tag[]> {
    const rows = await db.select({
      id: tags.id,
      workspaceId: tags.workspaceId,
      name: tags.name,
      color: tags.color,
      isSystem: tags.isSystem,
      createdAt: tags.createdAt,
    }).from(pageTags)
      .innerJoin(tags, eq(pageTags.tagId, tags.id))
      .where(eq(pageTags.pageId, pageId));

    return rows;
  }
}
