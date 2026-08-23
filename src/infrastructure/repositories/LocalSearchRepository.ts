import { db } from '../db/drizzle';
import { pages, sections, notebooks } from '../db/schema';
import { eq, and, isNull, like, or } from 'drizzle-orm';
import { ISearchRepository } from '../../domain/repositories/ISearchRepository';
import { SearchResult } from '../../domain/types';

export class LocalSearchRepository implements ISearchRepository {
  async search(workspaceId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = `%${query.trim().toLowerCase()}%`;

    const rows = await db.select({
      pageId: pages.id,
      title: pages.title,
      content: pages.content,
      notebookName: notebooks.name,
      sectionName: sections.name,
      updatedAt: pages.updatedAt,
    }).from(pages)
      .innerJoin(sections, eq(pages.sectionId, sections.id))
      .innerJoin(notebooks, eq(sections.notebookId, notebooks.id))
      .where(
        and(
          eq(notebooks.workspaceId, workspaceId),
          isNull(pages.deletedAt),
          or(
            like(pages.title, q),
            like(pages.content, q),
            like(pages.syllabusSubject, q),
            like(pages.syllabusTopic, q)
          )
        )
      )
      .limit(30);

    return rows.map(r => {
      // Snippet generation
      let snippet = 'Matching page content';
      try {
        const text = typeof r.content === 'string' ? r.content : JSON.stringify(r.content);
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(text.length, idx + 80);
          snippet = `...${text.substring(start, end).replace(/[{}[\]"]/g, '')}...`;
        }
      } catch {
        snippet = r.title;
      }

      return {
        id: r.pageId,
        pageId: r.pageId,
        title: r.title || 'Untitled',
        snippet,
        notebookName: r.notebookName,
        sectionName: r.sectionName,
        updatedAt: r.updatedAt,
      };
    });
  }

  async indexPage(): Promise<void> {}
  async removePage(): Promise<void> {}
  async reindexAll(): Promise<void> {}
}
