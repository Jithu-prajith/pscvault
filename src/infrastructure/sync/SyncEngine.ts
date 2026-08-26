import { getDBClient } from '../db/client';
import { getDeviceId } from './deviceInfo';
import { useAuthStore } from '../../stores/authStore';

export interface SyncOperation {
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  entityType: 'WORKSPACE' | 'NOTEBOOK' | 'SECTION_GROUP' | 'SECTION' | 'PAGE' | 'ATTACHMENT' | 'TAG';
  entityId: string;
  version?: number;
  data?: any;
}

class SyncEngineClass {
  private apiBaseUrl: string = 'http://localhost:5000/api';
  private syncInProgress: boolean = false;

  constructor() {
    this.setupNetworkListeners();
  }

  public setApiBaseUrl(url: string) {
    this.apiBaseUrl = url.replace(/\/$/, '');
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Internet Connection Restored. Triggering Auto Sync...');
        useAuthStore.getState().setSyncStatus('syncing');
        this.pushLocalChanges()
          .then(() => this.pullServerChanges())
          .then(() => useAuthStore.getState().setSyncStatus('synced', new Date().toISOString()))
          .catch(() => useAuthStore.getState().setSyncStatus('error'));
      });

      window.addEventListener('offline', () => {
        console.log('☁ Device Disconnected. Operating in Offline-First Mode.');
        useAuthStore.getState().setSyncStatus('offline');
      });
    }
  }

  private getAuthHeaders(): Record<string, string> {
    let token = '';
    try {
      const sess = localStorage.getItem('pscvault_session');
      if (sess) token = JSON.parse(sess).token || '';
    } catch {}

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-device-id': getDeviceId(),
    };
  }

  // ----------------------------------------------------
  // LOCAL SYNC QUEUE MANAGEMENT
  // ----------------------------------------------------
  public getLocalQueue(): SyncOperation[] {
    try {
      const raw = localStorage.getItem('pscvault_sync_queue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalQueue(queue: SyncOperation[]) {
    try {
      localStorage.setItem('pscvault_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed saving sync queue:', e);
    }
  }

  public enqueueOperation(op: SyncOperation) {
    const queue = this.getLocalQueue();
    // Deduplicate pending updates for same entityId if unpushed
    const idx = queue.findIndex(item => item.entityId === op.entityId && item.operation === op.operation);
    if (idx !== -1 && op.operation === 'UPDATE') {
      queue[idx] = { ...queue[idx], data: { ...queue[idx].data, ...op.data } };
    } else {
      queue.push(op);
    }
    this.saveLocalQueue(queue);

    if (typeof window !== 'undefined' && !navigator.onLine) {
      useAuthStore.getState().setSyncStatus('offline');
      return;
    }

    // Auto-trigger background push if online
    this.pushLocalChanges().catch(() => {
      useAuthStore.getState().setSyncStatus('offline');
    });
  }

  // ----------------------------------------------------
  // FIRST LOGIN ON A NEW DEVICE
  // ----------------------------------------------------
  public async syncOnLogin(token: string): Promise<{ hasCloudWorkspace: boolean }> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      useAuthStore.getState().setSyncStatus('offline');
      return { hasCloudWorkspace: false };
    }

    try {
      useAuthStore.getState().setSyncStatus('syncing');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-device-id': getDeviceId(),
      };

      const wsRes = await fetch(`${this.apiBaseUrl}/workspace`, { headers });
      if (!wsRes.ok) {
        useAuthStore.getState().setSyncStatus('offline');
        return { hasCloudWorkspace: false };
      }

      const wsData = await wsRes.json();
      if (!wsData.exists || !wsData.workspace) {
        useAuthStore.getState().setSyncStatus('synced');
        return { hasCloudWorkspace: false };
      }

      const db = await getDBClient();

      await db.execute(
        `INSERT OR REPLACE INTO "workspaces" ("id", "user_id", "name", "slug", "icon", "settings", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          wsData.workspace.id, wsData.workspace.userId, wsData.workspace.name,
          wsData.workspace.slug, wsData.workspace.icon, JSON.stringify(wsData.workspace.settings || {}),
          wsData.workspace.position, wsData.workspace.version, wsData.workspace.createdAt, wsData.workspace.updatedAt
        ]
      );

      for (const nb of wsData.notebooks) {
        await db.execute(
          `INSERT OR REPLACE INTO "notebooks" ("id", "workspace_id", "name", "icon", "color", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [nb.id, nb.workspaceId, nb.name, nb.icon, nb.color, nb.position, nb.version, nb.createdAt, nb.updatedAt]
        );
      }

      for (const g of wsData.groups) {
        await db.execute(
          `INSERT OR REPLACE INTO "section_groups" ("id", "notebook_id", "name", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [g.id, g.notebookId, g.name, g.position, g.version, g.createdAt, g.updatedAt]
        );
      }

      for (const s of wsData.subjects) {
        await db.execute(
          `INSERT OR REPLACE INTO "sections" ("id", "notebook_id", "section_group_id", "name", "icon", "color", "position", "version", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [s.id, s.notebookId, s.sectionGroupId, s.name, s.icon, s.color, s.position, s.version, s.createdAt, s.updatedAt]
        );
      }

      await this.pullServerChanges(token, 0);
      useAuthStore.getState().setSyncStatus('synced', new Date().toISOString());

      return { hasCloudWorkspace: true };
    } catch (err) {
      console.warn('Sync on login warning:', err);
      useAuthStore.getState().setSyncStatus('offline');
      return { hasCloudWorkspace: false };
    }
  }

  // ----------------------------------------------------
  // PUSH LOCAL CHANGES TO CLOUD
  // ----------------------------------------------------
  public async pushLocalChanges(): Promise<boolean> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      useAuthStore.getState().setSyncStatus('offline');
      return false;
    }

    while (this.syncInProgress) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const queue = this.getLocalQueue();
    if (queue.length === 0) {
      useAuthStore.getState().setSyncStatus('synced');
      return true;
    }

    this.syncInProgress = true;
    useAuthStore.getState().setSyncStatus('syncing');

    try {
      const headers = this.getAuthHeaders();
      const bodyStr = JSON.stringify({
        deviceId: getDeviceId(),
        operations: queue,
      });

      const res = await fetch(`${this.apiBaseUrl}/sync/push`, {
        method: 'POST',
        headers,
        body: bodyStr,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.saveLocalQueue([]);
          if (data.nextCursor) {
            localStorage.setItem('pscvault_sync_cursor', String(data.nextCursor));
          }
          useAuthStore.getState().setSyncStatus('synced', new Date().toISOString());
          return true;
        }
      } else {
        useAuthStore.getState().setSyncStatus('error');
      }
    } catch (e) {
      console.warn('Sync push network warning:', e);
      useAuthStore.getState().setSyncStatus('offline');
    } finally {
      this.syncInProgress = false;
    }
    return false;
  }

  // ----------------------------------------------------
  // PULL INCREMENTAL CHANGES FROM CLOUD
  // ----------------------------------------------------
  public async pullServerChanges(overrideToken?: string, overrideCursor?: number): Promise<boolean> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return false;
    }

    try {
      const headers = overrideToken
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${overrideToken}`, 'x-device-id': getDeviceId() }
        : this.getAuthHeaders();

      const currentCursor = overrideCursor !== undefined
        ? overrideCursor
        : parseInt(localStorage.getItem('pscvault_sync_cursor') || '0', 10);

      const res = await fetch(`${this.apiBaseUrl}/sync/pull?cursor=${currentCursor}`, { headers });
      if (!res.ok) return false;

      const data = await res.json();
      if (data.changes && data.changes.length > 0) {
        const db = await getDBClient();

        for (const ch of data.changes) {
          const { operation, entityType, entityId, data: itemData } = ch;

          if (entityType === 'PAGE') {
            if (operation === 'DELETE') {
              await db.execute(`UPDATE "pages" SET "deleted_at" = $1 WHERE "id" = $2`, [new Date().toISOString(), entityId]);
            } else if (operation === 'RESTORE') {
              await db.execute(`UPDATE "pages" SET "deleted_at" = NULL WHERE "id" = $1`, [entityId]);
            } else if (itemData) {
              const contentStr = typeof itemData.content === 'object' ? JSON.stringify(itemData.content) : (itemData.content || '{}');
              await db.execute(
                `INSERT OR REPLACE INTO "pages" ("id", "section_id", "parent_id", "type", "numbering", "title", "icon", "cover_image", "content", "position", "syllabus_exam", "syllabus_stage", "syllabus_paper", "syllabus_subject", "syllabus_topic", "is_favorite", "is_template", "version", "created_at", "updated_at", "deleted_at") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
                [
                  itemData.id || entityId, itemData.sectionId, itemData.parentId || null, itemData.type || 'topic',
                  itemData.numbering || null, itemData.title, itemData.icon || '📄', itemData.coverImage || null,
                  contentStr, itemData.position || 'a0', itemData.syllabusExam || 'UPSC CSE', itemData.syllabusStage || null,
                  itemData.syllabusPaper || null, itemData.syllabusSubject || null, itemData.syllabusTopic || null,
                  itemData.isFavorite ? 1 : 0, itemData.isTemplate ? 1 : 0, itemData.version || 1,
                  itemData.createdAt || new Date().toISOString(), itemData.updatedAt || new Date().toISOString(),
                  itemData.deletedAt || null
                ]
              );
            }
          }
        }

        if (data.nextCursor) {
          localStorage.setItem('pscvault_sync_cursor', String(data.nextCursor));
        }
      }
      return true;
    } catch (e) {
      console.warn('Sync pull warning:', e);
      return false;
    }
  }

  // ----------------------------------------------------
  // GET SYNC STATUS
  // ----------------------------------------------------
  public getSyncStatus(): { status: 'synced' | 'syncing' | 'offline' | 'error'; pendingOps: number } {
    const queue = this.getLocalQueue();
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return { status: 'offline', pendingOps: queue.length };
    }
    if (this.syncInProgress) {
      return { status: 'syncing', pendingOps: queue.length };
    }
    if (queue.length > 0) {
      return { status: 'offline', pendingOps: queue.length };
    }
    return { status: 'synced', pendingOps: 0 };
  }
}

export const SyncEngine = new SyncEngineClass();
