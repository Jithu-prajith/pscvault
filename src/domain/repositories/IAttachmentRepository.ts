import { Attachment, MediaType, EntityId, StorageStats } from '../types';

export interface CreateAttachmentDTO {
  workspaceId: EntityId;
  pageId?: EntityId | null;
  originalFileName: string;
  mimeType: string;
  fileData: Uint8Array;
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export interface IAttachmentRepository {
  getById(id: EntityId): Promise<Attachment | null>;
  getByPage(pageId: EntityId): Promise<Attachment[]>;
  getByWorkspace(workspaceId: EntityId, mediaType?: MediaType): Promise<Attachment[]>;
  getDeleted(workspaceId: EntityId): Promise<Attachment[]>;
  save(dto: CreateAttachmentDTO): Promise<Attachment>;
  update(id: EntityId, data: Partial<Pick<Attachment, 'originalFileName' | 'extractedText' | 'transcriptionText' | 'metadata'>>): Promise<Attachment>;
  softDelete(id: EntityId): Promise<void>;
  restore(id: EntityId): Promise<void>;
  permanentDelete(id: EntityId): Promise<void>;
  getAssetUrl(attachment: Attachment): Promise<string>;
  getAbsolutePath(attachment: Attachment): Promise<string>;
  duplicate(id: EntityId, targetPageId: EntityId): Promise<Attachment>;
  getStorageStats(workspaceId: EntityId): Promise<StorageStats>;
}
