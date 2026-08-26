import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  WorkspaceModel, NotebookModel, SectionGroupModel, SectionModel,
  UserModel, UserCursorModel
} from '../models/schemas';
import { memoryMongo } from '../models/memoryStore';

const router = Router();
const isMongoConnected = () => mongoose.connection.readyState === 1;

// GET /api/workspace
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user: any = isMongoConnected()
      ? await UserModel.findOne({ userId })
      : await memoryMongo.findOne('users', { userId });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const workspace: any = isMongoConnected()
      ? await WorkspaceModel.findOne({ userId, deletedAt: null }).sort({ createdAt: 1 })
      : await memoryMongo.findOne('workspaces', { userId, deletedAt: null });

    if (!workspace) {
      return res.json({
        exists: false,
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
        },
        workspace: null,
        notebooks: [],
        groups: [],
        subjects: [],
        sync: {
          serverVersion: 0,
          lastSyncAt: new Date().toISOString(),
        },
      });
    }

    const notebooks: any[] = isMongoConnected()
      ? await NotebookModel.find({ userId, workspaceId: workspace.id, deletedAt: null }).sort({ position: 1 })
      : await memoryMongo.find('notebooks', { userId, workspaceId: workspace.id, deletedAt: null });

    const notebookIds = notebooks.map(nb => nb.id);

    const groups: any[] = isMongoConnected()
      ? await SectionGroupModel.find({ userId, notebookId: { $in: notebookIds }, deletedAt: null }).sort({ position: 1 })
      : await memoryMongo.find('section_groups', { userId, notebookId: { $in: notebookIds }, deletedAt: null });

    const subjects: any[] = isMongoConnected()
      ? await SectionModel.find({ userId, notebookId: { $in: notebookIds }, deletedAt: null }).sort({ position: 1 })
      : await memoryMongo.find('sections', { userId, notebookId: { $in: notebookIds }, deletedAt: null });

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

    return res.json({
      exists: true,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
      },
      workspace: {
        id: workspace.id,
        userId: workspace.userId,
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
        settings: workspace.settings,
        position: workspace.position,
        version: workspace.version,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      notebooks: notebooks.map(nb => ({
        id: nb.id,
        workspaceId: nb.workspaceId,
        name: nb.name,
        icon: nb.icon,
        color: nb.color,
        position: nb.position,
        version: nb.version,
        createdAt: nb.createdAt,
        updatedAt: nb.updatedAt,
      })),
      groups: groups.map(g => ({
        id: g.id,
        notebookId: g.notebookId,
        name: g.name,
        position: g.position,
        version: g.version,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      subjects: subjects.map(s => ({
        id: s.id,
        notebookId: s.notebookId,
        sectionGroupId: s.sectionGroupId || null,
        name: s.name,
        icon: s.icon,
        color: s.color,
        position: s.position,
        version: s.version,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      sync: {
        serverVersion: userCursor.currentCursor,
        lastSyncAt: new Date(userCursor.lastSyncAt).toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Fetch workspace error:', err);
    return res.status(500).json({ error: 'Failed fetching cloud workspace.', detail: err.message });
  }
});

export default router;
