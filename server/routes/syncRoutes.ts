import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  WorkspaceModel, NotebookModel, SectionGroupModel, SectionModel,
  PageModel, AttachmentModel, TagModel, PageTagModel,
  SyncChangeModel, UserCursorModel
} from '../models/schemas';
import { memoryMongo } from '../models/memoryStore';

const router = Router();
const isMongoConnected = () => mongoose.connection.readyState === 1;

async function applyEntityOperation(
  userId: string,
  op: { operation: string; entityType: string; entityId: string; version?: number; data?: any }
) {
  const { operation, entityType, entityId, data } = op;
  const now = new Date();

  const type = entityType.toUpperCase();
  let collectionName = 'pages';
  let model: any = PageModel;

  if (type === 'WORKSPACE')     { collectionName = 'workspaces';     model = WorkspaceModel; }
  if (type === 'NOTEBOOK')      { collectionName = 'notebooks';      model = NotebookModel; }
  if (type === 'SECTION_GROUP') { collectionName = 'section_groups'; model = SectionGroupModel; }
  if (type === 'SECTION')       { collectionName = 'sections';       model = SectionModel; }
  if (type === 'PAGE')          { collectionName = 'pages';          model = PageModel; }
  if (type === 'ATTACHMENT')    { collectionName = 'attachments';    model = AttachmentModel; }
  if (type === 'TAG')           { collectionName = 'tags';           model = TagModel; }

  // 1. DELETE Operation
  if (operation.toUpperCase() === 'DELETE') {
    if (type === 'PAGE') {
      if (isMongoConnected()) {
        await PageModel.updateMany({ userId, $or: [{ id: entityId }, { parentId: entityId }] }, { $set: { deletedAt: now, updatedAt: now } });
      } else {
        await memoryMongo.updateMany('pages', { userId, $or: [{ id: entityId }, { parentId: entityId }] }, { $set: { deletedAt: now, updatedAt: now } });
      }
    } else {
      if (isMongoConnected()) {
        await model.updateOne({ userId, id: entityId }, { $set: { deletedAt: now, updatedAt: now } });
      } else {
        await memoryMongo.updateOne(collectionName, { userId, id: entityId }, { $set: { deletedAt: now, updatedAt: now } });
      }
    }
    return { id: entityId, action: 'deleted' };
  }

  // 2. RESTORE Operation
  if (operation.toUpperCase() === 'RESTORE') {
    if (type === 'PAGE') {
      if (isMongoConnected()) {
        await PageModel.updateMany({ userId, $or: [{ id: entityId }, { parentId: entityId }] }, { $set: { deletedAt: null, updatedAt: now } });
      } else {
        await memoryMongo.updateMany('pages', { userId, $or: [{ id: entityId }, { parentId: entityId }] }, { $set: { deletedAt: null, updatedAt: now } });
      }
    } else {
      if (isMongoConnected()) {
        await model.updateOne({ userId, id: entityId }, { $set: { deletedAt: null, updatedAt: now } });
      } else {
        await memoryMongo.updateOne(collectionName, { userId, id: entityId }, { $set: { deletedAt: null, updatedAt: now } });
      }
    }
    return { id: entityId, action: 'restored' };
  }

  // 3. CREATE / UPDATE Operation
  const payload = { ...data, userId, id: entityId, updatedAt: now };

  if (isMongoConnected()) {
    await model.updateOne({ userId, id: entityId }, { $set: payload }, { upsert: true });
  } else {
    await memoryMongo.updateOne(collectionName, { userId, id: entityId }, { $set: payload }, { upsert: true });
  }

  return { id: entityId, action: 'upserted' };
}

// 1. POST /api/sync/push
router.post('/push', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deviceId = req.user!.deviceId || 'unknown-device';
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.json({ success: true, processedCount: 0, serverVersion: 0, nextCursor: 0, conflicts: [] });
    }

    let userCursor: any = isMongoConnected()
      ? await UserCursorModel.findOne({ userId })
      : await memoryMongo.findOne('user_cursors', { userId });

    if (!userCursor) {
      userCursor = { userId, currentCursor: 0, lastSyncAt: new Date() };
      if (isMongoConnected()) {
        await UserCursorModel.create(userCursor);
      } else {
        await memoryMongo.create('user_cursors', userCursor);
      }
    }

    let nextCursor = userCursor.currentCursor;
    const processedOps: any[] = [];
    const conflicts: any[] = [];

    for (const op of operations) {
      try {
        await applyEntityOperation(userId, op);
        nextCursor++;

        const changeObj = {
          userId,
          cursor: nextCursor,
          operation: op.operation.toUpperCase(),
          entityType: op.entityType.toUpperCase(),
          entityId: op.entityId,
          data: op.data || {},
          deviceId,
          timestamp: new Date(),
        };

        if (isMongoConnected()) {
          await SyncChangeModel.create(changeObj);
        } else {
          await memoryMongo.create('sync_changes', changeObj);
        }

        processedOps.push(op);
      } catch (err: any) {
        console.warn(`Sync push operation error for ${op.entityType} ${op.entityId}:`, err);
        conflicts.push({ operation: op, error: err.message });
      }
    }

    userCursor.currentCursor = nextCursor;
    userCursor.lastSyncAt = new Date();

    if (isMongoConnected()) {
      await UserCursorModel.updateOne({ userId }, { $set: { currentCursor: nextCursor, lastSyncAt: new Date() } });
    } else {
      await memoryMongo.updateOne('user_cursors', { userId }, { $set: { currentCursor: nextCursor, lastSyncAt: new Date() } });
    }

    return res.json({
      success: true,
      processedCount: processedOps.length,
      serverVersion: nextCursor,
      nextCursor,
      conflicts,
    });
  } catch (err: any) {
    console.error('Sync push error:', err);
    return res.status(500).json({ error: 'Failed executing sync push.', detail: err.message });
  }
});

// 2. GET /api/sync/pull?cursor=123
router.get('/pull', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const clientCursor = parseInt((req.query.cursor as string) || '0', 10);

    const userCursor: any = isMongoConnected()
      ? await UserCursorModel.findOne({ userId })
      : await memoryMongo.findOne('user_cursors', { userId });

    const serverVersion = userCursor ? userCursor.currentCursor : 0;

    const changes: any[] = isMongoConnected()
      ? await SyncChangeModel.find({ userId, cursor: { $gt: clientCursor } }).sort({ cursor: 1 })
      : await memoryMongo.find('sync_changes', { userId, cursor: { $gt: clientCursor } });

    const formattedChanges = changes.map((c) => ({
      cursor: c.cursor,
      operation: c.operation,
      entityType: c.entityType,
      entityId: c.entityId,
      data: c.data,
      deviceId: c.deviceId,
      timestamp: c.timestamp,
    }));

    return res.json({
      changes: formattedChanges,
      nextCursor: serverVersion,
      serverVersion,
    });
  } catch (err: any) {
    console.error('Sync pull error:', err);
    return res.status(500).json({ error: 'Failed executing sync pull.', detail: err.message });
  }
});

// 3. GET /api/sync/status
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userCursor: any = isMongoConnected()
      ? await UserCursorModel.findOne({ userId })
      : await memoryMongo.findOne('user_cursors', { userId });

    return res.json({
      status: 'synced',
      pendingOperations: 0,
      lastSyncedAt: userCursor ? new Date(userCursor.lastSyncAt).toISOString() : new Date().toISOString(),
      serverVersion: userCursor ? userCursor.currentCursor : 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching sync status.', detail: err.message });
  }
});

export default router;
