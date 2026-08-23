import { db } from '../db/drizzle';
import { pageRevisions, pages } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IRevisionRepository } from '../../domain/repositories/IRevisionRepository';
import { PageRevision } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export class LocalRevisionRepository implements IRevisionRepository {
  async getRevisions(pageId: string): Promise<PageRevision[]> {
    const rows = await db.select().from(pageRevisions)
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.version));

    return rows.map(r => ({
      ...r,
      contentSnapshot: typeof r.contentSnapshot === 'string' ? JSON.parse(r.contentSnapshot) : r.contentSnapshot,
    }));
  }

  async getRevision(revisionId: string): Promise<PageRevision | null> {
    const rows = await db.select().from(pageRevisions).where(eq(pageRevisions.id, revisionId));
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      contentSnapshot: typeof r.contentSnapshot === 'string' ? JSON.parse(r.contentSnapshot) : r.contentSnapshot,
    };
  }

  async createRevision(pageId: string, title: string, contentSnapshot: object, summary?: string): Promise<PageRevision> {
    const existing = await this.getRevisions(pageId);
    const version = existing.length > 0 ? existing[0].version + 1 : 1;
    const now = nowISO();
    const id = generateUUIDv7();

    const record = {
      id,
      pageId,
      version,
      title,
      contentSnapshot: JSON.stringify(contentSnapshot),
      changeSummary: summary || `Version ${version} checkpoint`,
      createdAt: now,
    };

    await db.insert(pageRevisions).values(record);
    return { ...record, contentSnapshot };
  }

  async restoreRevision(revisionId: string): Promise<object> {
    const rev = await this.getRevision(revisionId);
    if (!rev) throw new Error('Revision not found');

    const now = nowISO();
    await db.update(pages).set({
      title: rev.title,
      content: JSON.stringify(rev.contentSnapshot),
      updatedAt: now,
    }).where(eq(pages.id, rev.pageId));

    return rev.contentSnapshot;
  }
}
