import { db } from '../db/drizzle';
import { pages, sections, notebooks } from '../db/schema';
import { eq, and, isNull, asc, desc, sql, isNotNull } from 'drizzle-orm';
import { IPageRepository, CreatePageDTO, UpdatePageDTO } from '../../domain/repositories/IPageRepository';
import { Page, PageSummary, PageEntityType } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';
import { SyncEngine } from '../sync/SyncEngine';

export class LocalPageRepository implements IPageRepository {
  async getBySection(sectionId: string): Promise<PageSummary[]> {
    const rows = await db.select({
      id: pages.id,
      sectionId: pages.sectionId,
      parentId: pages.parentId,
      type: pages.type,
      numbering: pages.numbering,
      title: pages.title,
      icon: pages.icon,
      position: pages.position,
      isFavorite: pages.isFavorite,
      isTemplate: pages.isTemplate,
      syllabusSubject: pages.syllabusSubject,
      syllabusTopic: pages.syllabusTopic,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    }).from(pages).where(
      and(eq(pages.sectionId, sectionId), isNull(pages.deletedAt))
    ).orderBy(asc(pages.position));

    return rows.map(r => ({
      ...r,
      type: (r.type || 'page') as PageEntityType,
    }));
  }

  async getSubpages(parentId: string): Promise<PageSummary[]> {
    const rows = await db.select({
      id: pages.id,
      sectionId: pages.sectionId,
      parentId: pages.parentId,
      type: pages.type,
      numbering: pages.numbering,
      title: pages.title,
      icon: pages.icon,
      position: pages.position,
      isFavorite: pages.isFavorite,
      isTemplate: pages.isTemplate,
      syllabusSubject: pages.syllabusSubject,
      syllabusTopic: pages.syllabusTopic,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    }).from(pages).where(
      and(eq(pages.parentId, parentId), isNull(pages.deletedAt))
    ).orderBy(asc(pages.position));

    return rows.map(r => ({
      ...r,
      type: (r.type || 'page') as PageEntityType,
    }));
  }

  async getById(id: string): Promise<Page | null> {
    const rows = await db.select().from(pages).where(eq(pages.id, id));
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      type: (r.type || 'page') as PageEntityType,
      content: typeof r.content === 'string' ? JSON.parse(r.content || '{}') : r.content,
    };
  }

  async create(data: CreatePageDTO): Promise<Page> {
    const now = nowISO();
    const id = generateUUIDv7();
    const defaultContent = data.content || { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] };

    const newPage: any = {
      id,
      sectionId: data.sectionId,
      parentId: data.parentId || null,
      type: data.type || 'page',
      numbering: data.numbering || null,
      title: data.title || 'Untitled',
      icon: data.icon || (data.type === 'chapter' ? '📁' : '📄'),
      coverImage: null,
      content: JSON.stringify(defaultContent),
      position: 'a0',
      syllabusExam: data.syllabusExam || 'UPSC CSE',
      syllabusStage: data.syllabusStage || null,
      syllabusPaper: data.syllabusPaper || null,
      syllabusSubject: data.syllabusSubject || null,
      syllabusTopic: data.syllabusTopic || null,
      isFavorite: false,
      isTemplate: false,
      revisionStatus: 0,
      lastRevisedAt: null,
      nextRevisionAt: null,
      revisionCount: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(pages).values(newPage);

    const createdPage = {
      ...newPage,
      type: (newPage.type || 'page') as PageEntityType,
      content: defaultContent,
    };

    // Background Sync Queue Enqueue
    SyncEngine.enqueueOperation({
      operation: 'CREATE',
      entityType: 'PAGE',
      entityId: id,
      version: 1,
      data: createdPage,
    });

    return createdPage;
  }

  async createChapter(sectionId: string, title?: string): Promise<Page> {
    const existingChapters = await db.select().from(pages).where(
      and(
        eq(pages.sectionId, sectionId),
        eq(pages.type, 'chapter'),
        isNull(pages.deletedAt)
      )
    );

    const num = existingChapters.length + 1;
    const chapterNumbering = String(num);
    const chapterTitle = title
      ? (title.startsWith('Chapter') ? title : `Chapter ${num} — ${title}`)
      : `Chapter ${num}`;

    return this.create({
      sectionId,
      parentId: null,
      type: 'chapter',
      numbering: chapterNumbering,
      title: chapterTitle,
      icon: '📁',
    });
  }

  async createTopic(chapterId: string, title?: string): Promise<Page> {
    const chapter = await this.getById(chapterId);
    if (!chapter) throw new Error('Parent chapter not found');

    const existingTopics = await db.select().from(pages).where(
      and(
        eq(pages.parentId, chapterId),
        isNull(pages.deletedAt)
      )
    );

    const topicIndex = existingTopics.length + 1;
    const chapterNum = chapter.numbering || '1';
    const topicNumbering = `${chapterNum}.${topicIndex}`;
    const topicTitle = title
      ? (title.startsWith(topicNumbering) ? title : `${topicNumbering} ${title}`)
      : `${topicNumbering} Topic Name`;

    return this.create({
      sectionId: chapter.sectionId,
      parentId: chapterId,
      type: 'topic',
      numbering: topicNumbering,
      title: topicTitle,
      icon: '📄',
      syllabusPaper: chapter.syllabusPaper || undefined,
      syllabusSubject: chapter.syllabusSubject || undefined,
    });
  }

  async update(id: string, data: UpdatePageDTO): Promise<Page> {
    const now = nowISO();
    const existing = await this.getById(id);
    const nextVer = (existing?.version || 1) + 1;
    const updateData: any = { updatedAt: now, version: nextVer };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.content !== undefined) updateData.content = JSON.stringify(data.content);
    if (data.syllabusExam !== undefined) updateData.syllabusExam = data.syllabusExam;
    if (data.syllabusStage !== undefined) updateData.syllabusStage = data.syllabusStage;
    if (data.syllabusPaper !== undefined) updateData.syllabusPaper = data.syllabusPaper;
    if (data.syllabusSubject !== undefined) updateData.syllabusSubject = data.syllabusSubject;
    if (data.syllabusTopic !== undefined) updateData.syllabusTopic = data.syllabusTopic;
    if (data.revisionStatus !== undefined) updateData.revisionStatus = data.revisionStatus;

    await db.update(pages).set(updateData).where(eq(pages.id, id));
    const updated = await this.getById(id);

    if (updated) {
      SyncEngine.enqueueOperation({
        operation: 'UPDATE',
        entityType: 'PAGE',
        entityId: id,
        version: updated.version,
        data: updated,
      });
    }

    return updated!;
  }

  async updateContent(id: string, content: object): Promise<{ version: number }> {
    const now = nowISO();
    const existing = await this.getById(id);
    const nextVer = (existing?.version || 1) + 1;

    await db.update(pages).set({
      content: JSON.stringify(content),
      updatedAt: now,
      version: nextVer,
    }).where(eq(pages.id, id));

    const p = await this.getById(id);
    if (p) {
      SyncEngine.enqueueOperation({
        operation: 'UPDATE',
        entityType: 'PAGE',
        entityId: id,
        version: p.version,
        data: p,
      });
    }
    return { version: nextVer };
  }

  async softDelete(id: string): Promise<void> {
    const now = nowISO();
    await db.update(pages).set({ deletedAt: now }).where(eq(pages.id, id));
    await db.update(pages).set({ deletedAt: now }).where(eq(pages.parentId, id));

    SyncEngine.enqueueOperation({
      operation: 'DELETE',
      entityType: 'PAGE',
      entityId: id,
    });
  }

  async restore(id: string): Promise<void> {
    await db.update(pages).set({ deletedAt: null }).where(eq(pages.id, id));
    await db.update(pages).set({ deletedAt: null }).where(eq(pages.parentId, id));

    SyncEngine.enqueueOperation({
      operation: 'RESTORE',
      entityType: 'PAGE',
      entityId: id,
    });
  }

  async permanentDelete(id: string): Promise<void> {
    await db.delete(pages).where(eq(pages.parentId, id));
    await db.delete(pages).where(eq(pages.id, id));

    SyncEngine.enqueueOperation({
      operation: 'DELETE',
      entityType: 'PAGE',
      entityId: id,
    });
  }

  async reorder(id: string, newPosition: string): Promise<void> {
    await db.update(pages).set({ position: newPosition, updatedAt: nowISO() }).where(eq(pages.id, id));
    const p = await this.getById(id);
    if (p) {
      SyncEngine.enqueueOperation({
        operation: 'UPDATE',
        entityType: 'PAGE',
        entityId: id,
        data: p,
      });
    }
  }

  async move(id: string, targetSectionId: string): Promise<void> {
    await db.update(pages).set({ sectionId: targetSectionId, updatedAt: nowISO() }).where(eq(pages.id, id));
    const p = await this.getById(id);
    if (p) {
      SyncEngine.enqueueOperation({
        operation: 'UPDATE',
        entityType: 'PAGE',
        entityId: id,
        data: p,
      });
    }
  }

  async duplicate(id: string): Promise<Page> {
    const source = await this.getById(id);
    if (!source) throw new Error('Page not found');
    return this.create({
      sectionId: source.sectionId,
      parentId: source.parentId,
      type: source.type,
      numbering: source.numbering,
      title: `${source.title} (Copy)`,
      icon: source.icon || undefined,
      content: source.content,
      syllabusExam: source.syllabusExam || undefined,
      syllabusStage: source.syllabusStage || undefined,
      syllabusPaper: source.syllabusPaper || undefined,
      syllabusSubject: source.syllabusSubject || undefined,
      syllabusTopic: source.syllabusTopic || undefined,
    });
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const p = await this.getById(id);
    if (!p) return false;
    const nextState = !p.isFavorite;
    await db.update(pages).set({ isFavorite: nextState, updatedAt: nowISO() }).where(eq(pages.id, id));
    
    SyncEngine.enqueueOperation({
      operation: 'UPDATE',
      entityType: 'PAGE',
      entityId: id,
      data: { ...p, isFavorite: nextState },
    });

    return nextState;
  }

  async getFavorites(workspaceId: string): Promise<PageSummary[]> {
    const rows = await db.select({
      id: pages.id,
      sectionId: pages.sectionId,
      parentId: pages.parentId,
      type: pages.type,
      numbering: pages.numbering,
      title: pages.title,
      icon: pages.icon,
      position: pages.position,
      isFavorite: pages.isFavorite,
      isTemplate: pages.isTemplate,
      syllabusSubject: pages.syllabusSubject,
      syllabusTopic: pages.syllabusTopic,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    }).from(pages)
      .innerJoin(sections, eq(pages.sectionId, sections.id))
      .innerJoin(notebooks, eq(sections.notebookId, notebooks.id))
      .where(
        and(
          eq(notebooks.workspaceId, workspaceId),
          eq(pages.isFavorite, true),
          isNull(pages.deletedAt)
        )
      );

    return rows.map(r => ({ ...r, type: (r.type || 'page') as PageEntityType }));
  }

  async getRecent(workspaceId: string, limit = 10): Promise<PageSummary[]> {
    const rows = await db.select({
      id: pages.id,
      sectionId: pages.sectionId,
      parentId: pages.parentId,
      type: pages.type,
      numbering: pages.numbering,
      title: pages.title,
      icon: pages.icon,
      position: pages.position,
      isFavorite: pages.isFavorite,
      isTemplate: pages.isTemplate,
      syllabusSubject: pages.syllabusSubject,
      syllabusTopic: pages.syllabusTopic,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    }).from(pages)
      .innerJoin(sections, eq(pages.sectionId, sections.id))
      .innerJoin(notebooks, eq(sections.notebookId, notebooks.id))
      .where(
        and(
          eq(notebooks.workspaceId, workspaceId),
          isNull(pages.deletedAt)
        )
      )
      .orderBy(desc(pages.updatedAt))
      .limit(limit);

    return rows.map(r => ({ ...r, type: (r.type || 'page') as PageEntityType }));
  }

  async getByTag(tagId: string): Promise<PageSummary[]> {
    return [];
  }

  async getDeleted(workspaceId: string): Promise<PageSummary[]> {
    const rows = await db.select({
      id: pages.id,
      sectionId: pages.sectionId,
      parentId: pages.parentId,
      type: pages.type,
      numbering: pages.numbering,
      title: pages.title,
      icon: pages.icon,
      position: pages.position,
      isFavorite: pages.isFavorite,
      isTemplate: pages.isTemplate,
      syllabusSubject: pages.syllabusSubject,
      syllabusTopic: pages.syllabusTopic,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    }).from(pages)
      .innerJoin(sections, eq(pages.sectionId, sections.id))
      .innerJoin(notebooks, eq(sections.notebookId, notebooks.id))
      .where(
        and(
          eq(notebooks.workspaceId, workspaceId),
          isNotNull(pages.deletedAt)
        )
      );

    return rows.map(r => ({ ...r, type: (r.type || 'page') as PageEntityType }));
  }
}
