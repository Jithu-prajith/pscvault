import { db } from '../db/drizzle';
import { attachments } from '../db/schema';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { IAttachmentRepository, CreateAttachmentDTO } from '../../domain/repositories/IAttachmentRepository';
import { Attachment, MediaType, StorageStats } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';
import { saveAttachmentFile, resolveAssetUrl, deleteAttachmentFile, classifyMediaType, getExtension } from '../fs/fileService';

export class LocalAttachmentRepository implements IAttachmentRepository {
  async getById(id: string): Promise<Attachment | null> {
    const rows = await db.select().from(attachments).where(eq(attachments.id, id));
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      mediaType: r.mediaType as MediaType,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata,
    };
  }

  async getByPage(pageId: string): Promise<Attachment[]> {
    const rows = await db.select().from(attachments).where(
      and(eq(attachments.pageId, pageId), isNull(attachments.deletedAt))
    );
    return rows.map(r => ({
      ...r,
      mediaType: r.mediaType as MediaType,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata,
    }));
  }

  async getByWorkspace(workspaceId: string, mediaType?: MediaType): Promise<Attachment[]> {
    const conditions = [eq(attachments.workspaceId, workspaceId), isNull(attachments.deletedAt)];
    if (mediaType) {
      conditions.push(eq(attachments.mediaType, mediaType));
    }
    const rows = await db.select().from(attachments).where(and(...conditions));
    return rows.map(r => ({
      ...r,
      mediaType: r.mediaType as MediaType,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata,
    }));
  }

  async getDeleted(workspaceId: string): Promise<Attachment[]> {
    const rows = await db.select().from(attachments).where(
      and(eq(attachments.workspaceId, workspaceId), isNotNull(attachments.deletedAt))
    );
    return rows.map(r => ({
      ...r,
      mediaType: r.mediaType as MediaType,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata,
    }));
  }

  async save(dto: CreateAttachmentDTO): Promise<Attachment> {
    const mediaType = classifyMediaType(dto.mimeType);
    const saved = await saveAttachmentFile(dto.fileData, dto.originalFileName, mediaType);
    const now = nowISO();
    const id = generateUUIDv7();

    const record: any = {
      id,
      workspaceId: dto.workspaceId,
      pageId: dto.pageId || null,
      fileName: saved.fileName,
      originalFileName: dto.originalFileName,
      mimeType: dto.mimeType,
      fileExtension: getExtension(dto.originalFileName),
      fileSize: dto.fileData.byteLength,
      storagePath: saved.storagePath,
      sha256Hash: saved.sha256Hash,
      mediaType,
      width: dto.width || null,
      height: dto.height || null,
      duration: dto.duration || null,
      pageCount: dto.pageCount || null,
      thumbnailPath: null,
      extractedText: null,
      transcriptionText: null,
      metadata: JSON.stringify(dto.metadata || {}),
      syncStatus: 'LOCAL',
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(attachments).values(record);
    return {
      ...record,
      mediaType,
      metadata: dto.metadata || {},
    };
  }

  async update(id: string, data: Partial<Pick<Attachment, 'originalFileName' | 'extractedText' | 'transcriptionText' | 'metadata'>>): Promise<Attachment> {
    const now = nowISO();
    const updateData: any = { updatedAt: now };
    if (data.originalFileName !== undefined) updateData.originalFileName = data.originalFileName;
    if (data.extractedText !== undefined) updateData.extractedText = data.extractedText;
    if (data.transcriptionText !== undefined) updateData.transcriptionText = data.transcriptionText;
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

    await db.update(attachments).set(updateData).where(eq(attachments.id, id));
    const updated = await this.getById(id);
    return updated!;
  }

  async softDelete(id: string): Promise<void> {
    await db.update(attachments).set({ deletedAt: nowISO() }).where(eq(attachments.id, id));
  }

  async restore(id: string): Promise<void> {
    await db.update(attachments).set({ deletedAt: null }).where(eq(attachments.id, id));
  }

  async permanentDelete(id: string): Promise<void> {
    const att = await this.getById(id);
    if (att) {
      await deleteAttachmentFile(att.storagePath);
      await db.delete(attachments).where(eq(attachments.id, id));
    }
  }

  async getAssetUrl(attachment: Attachment): Promise<string> {
    return resolveAssetUrl(attachment.storagePath);
  }

  async getAbsolutePath(attachment: Attachment): Promise<string> {
    return attachment.storagePath;
  }

  async duplicate(id: string, targetPageId: string): Promise<Attachment> {
    const source = await this.getById(id);
    if (!source) throw new Error('Attachment not found');
    const now = nowISO();
    const newId = generateUUIDv7();

    const dupRecord: any = {
      ...source,
      id: newId,
      pageId: targetPageId,
      metadata: JSON.stringify(source.metadata),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(attachments).values(dupRecord);
    return { ...dupRecord, metadata: source.metadata };
  }

  async getStorageStats(workspaceId: string): Promise<StorageStats> {
    const all = await this.getByWorkspace(workspaceId);
    
    const stats: StorageStats = {
      totalSize: 0,
      imageSize: 0,
      pdfSize: 0,
      documentSize: 0,
      audioSize: 0,
      videoSize: 0,
      drawingSize: 0,
      otherSize: 0,
      databaseSize: 1024 * 1024, // Approx 1MB DB
      attachmentCount: all.length,
    };

    all.forEach(a => {
      stats.totalSize += a.fileSize;
      switch (a.mediaType) {
        case 'image':    stats.imageSize += a.fileSize; break;
        case 'pdf':      stats.pdfSize += a.fileSize; break;
        case 'document': stats.documentSize += a.fileSize; break;
        case 'audio':    stats.audioSize += a.fileSize; break;
        case 'video':    stats.videoSize += a.fileSize; break;
        case 'drawing':  stats.drawingSize += a.fileSize; break;
        default:         stats.otherSize += a.fileSize; break;
      }
    });

    return stats;
  }
}
