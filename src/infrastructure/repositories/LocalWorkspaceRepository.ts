import { db } from '../db/drizzle';
import { workspaces } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { IWorkspaceRepository, CreateWorkspaceDTO } from '../../domain/repositories/IWorkspaceRepository';
import { Workspace } from '../../domain/types';
import { generateUUIDv7, nowISO } from '../../lib/uuid';
import { slugify } from '../../lib/utils';
import { SyncEngine } from '../sync/SyncEngine';

export class LocalWorkspaceRepository implements IWorkspaceRepository {
  async getAll(userId: string): Promise<Workspace[]> {
    const rows = await db.select().from(workspaces).where(
      and(eq(workspaces.userId, userId), isNull(workspaces.deletedAt))
    );
    return rows.map(r => ({ ...r, settings: JSON.parse(r.settings || '{}') }));
  }

  async getById(id: string): Promise<Workspace | null> {
    const rows = await db.select().from(workspaces).where(eq(workspaces.id, id));
    if (rows.length === 0) return null;
    const r = rows[0];
    return { ...r, settings: JSON.parse(r.settings || '{}') };
  }

  async create(data: CreateWorkspaceDTO): Promise<Workspace> {
    const now = nowISO();
    const id = generateUUIDv7();
    const slug = data.slug || `${slugify(data.name)}-${id.slice(0, 6)}`;
    
    const newWs = {
      id,
      userId: data.userId,
      name: data.name,
      slug,
      icon: data.icon || '🏛️',
      settings: '{}',
      position: 'a0',
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(workspaces).values(newWs);

    const res = { ...newWs, settings: {} };
    SyncEngine.enqueueOperation({
      operation: 'CREATE',
      entityType: 'WORKSPACE',
      entityId: id,
      version: 1,
      data: res,
    });

    return res;
  }

  async update(id: string, data: Partial<Pick<Workspace, 'name' | 'icon' | 'settings'>>): Promise<Workspace> {
    const now = nowISO();
    const updateData: any = { updatedAt: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);

    await db.update(workspaces).set(updateData).where(eq(workspaces.id, id));
    const updated = await this.getById(id);

    if (updated) {
      SyncEngine.enqueueOperation({
        operation: 'UPDATE',
        entityType: 'WORKSPACE',
        entityId: id,
        version: updated.version,
        data: updated,
      });
    }

    return updated!;
  }

  async softDelete(id: string): Promise<void> {
    await db.update(workspaces).set({ deletedAt: nowISO() }).where(eq(workspaces.id, id));
    SyncEngine.enqueueOperation({
      operation: 'DELETE',
      entityType: 'WORKSPACE',
      entityId: id,
    });
  }

  async restore(id: string): Promise<void> {
    await db.update(workspaces).set({ deletedAt: null }).where(eq(workspaces.id, id));
    SyncEngine.enqueueOperation({
      operation: 'RESTORE',
      entityType: 'WORKSPACE',
      entityId: id,
    });
  }
}
