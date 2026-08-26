import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  NotebookModel, PageModel, AttachmentModel
} from '../models/schemas';
import { memoryMongo } from '../models/memoryStore';

const router = Router();
const isMongoConnected = () => mongoose.connection.readyState === 1;

// ==================================================
// NOTEBOOKS CRUD
// ==================================================
router.post('/notebooks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, workspaceId, name, icon, color, position } = req.body;

    const payload = {
      id,
      userId,
      workspaceId,
      name,
      icon: icon || '📚',
      color: color || '#6366f1',
      position: position || 'a0',
    };

    if (isMongoConnected()) {
      await NotebookModel.create(payload);
    } else {
      await memoryMongo.create('notebooks', payload);
    }

    return res.status(201).json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating notebook.', detail: err.message });
  }
});

router.get('/notebooks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const nbs = isMongoConnected()
      ? await NotebookModel.find({ userId, deletedAt: null }).sort({ position: 1 })
      : await memoryMongo.find('notebooks', { userId, deletedAt: null });

    return res.json(nbs);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching notebooks.', detail: err.message });
  }
});

router.patch('/notebooks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    if (isMongoConnected()) {
      await NotebookModel.updateOne({ userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    } else {
      await memoryMongo.updateOne('notebooks', { userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    }

    const updated = isMongoConnected()
      ? await NotebookModel.findOne({ userId, id })
      : await memoryMongo.findOne('notebooks', { userId, id });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed updating notebook.', detail: err.message });
  }
});

router.delete('/notebooks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    if (isMongoConnected()) {
      await NotebookModel.updateOne({ userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
    } else {
      await memoryMongo.updateOne('notebooks', { userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
    }

    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed deleting notebook.', detail: err.message });
  }
});

// ==================================================
// PAGES CRUD
// ==================================================
router.post('/pages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const payload = { ...req.body, userId };

    if (isMongoConnected()) {
      await PageModel.create(payload);
    } else {
      await memoryMongo.create('pages', payload);
    }

    return res.status(201).json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating page.', detail: err.message });
  }
});

router.get('/pages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const page = isMongoConnected()
      ? await PageModel.findOne({ userId, id })
      : await memoryMongo.findOne('pages', { userId, id });

    if (!page) return res.status(404).json({ error: 'Page not found.' });

    return res.json(page);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching page.', detail: err.message });
  }
});

router.patch('/pages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    if (isMongoConnected()) {
      await PageModel.updateOne({ userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    } else {
      await memoryMongo.updateOne('pages', { userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    }

    const updated = isMongoConnected()
      ? await PageModel.findOne({ userId, id })
      : await memoryMongo.findOne('pages', { userId, id });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed updating page.', detail: err.message });
  }
});

router.delete('/pages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;
    const now = new Date();

    if (isMongoConnected()) {
      await PageModel.updateMany(
        { userId, $or: [{ id }, { parentId: id }] },
        { $set: { deletedAt: now, updatedAt: now } }
      );
    } else {
      await memoryMongo.updateMany(
        'pages',
        { userId, $or: [{ id }, { parentId: id }] },
        { $set: { deletedAt: now, updatedAt: now } }
      );
    }

    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed deleting page.', detail: err.message });
  }
});

// ==================================================
// ATTACHMENTS CRUD
// ==================================================
router.post('/attachments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const payload = { ...req.body, userId };

    if (isMongoConnected()) {
      await AttachmentModel.create(payload);
    } else {
      await memoryMongo.create('attachments', payload);
    }

    return res.status(201).json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating attachment.', detail: err.message });
  }
});

router.get('/attachments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const att = isMongoConnected()
      ? await AttachmentModel.findOne({ userId, id })
      : await memoryMongo.findOne('attachments', { userId, id });

    if (!att) return res.status(404).json({ error: 'Attachment not found.' });

    return res.json(att);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching attachment.', detail: err.message });
  }
});

router.delete('/attachments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    if (isMongoConnected()) {
      await AttachmentModel.updateOne({ userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
    } else {
      await memoryMongo.updateOne('attachments', { userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
    }

    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed deleting attachment.', detail: err.message });
  }
});

// ==================================================
// TRASH MANAGERS
// ==================================================
router.get('/trash', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const deletedPages = isMongoConnected()
      ? await PageModel.find({ userId, deletedAt: { $ne: null } }).sort({ updatedAt: -1 })
      : await memoryMongo.find('pages', { userId, deletedAt: { $ne: null } });

    const deletedAtts = isMongoConnected()
      ? await AttachmentModel.find({ userId, deletedAt: { $ne: null } }).sort({ updatedAt: -1 })
      : await memoryMongo.find('attachments', { userId, deletedAt: { $ne: null } });

    return res.json({
      pages: deletedPages,
      attachments: deletedAtts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching trash.', detail: err.message });
  }
});

router.post('/trash/:id/restore', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;
    const now = new Date();

    const page = isMongoConnected()
      ? await PageModel.findOne({ userId, id })
      : await memoryMongo.findOne('pages', { userId, id });

    if (page) {
      if (isMongoConnected()) {
        await PageModel.updateMany(
          { userId, $or: [{ id }, { parentId: id }] },
          { $set: { deletedAt: null, updatedAt: now } }
        );
      } else {
        await memoryMongo.updateMany(
          'pages',
          { userId, $or: [{ id }, { parentId: id }] },
          { $set: { deletedAt: null, updatedAt: now } }
        );
      }
      return res.json({ success: true, restoredId: id, entityType: 'PAGE' });
    }

    const att = isMongoConnected()
      ? await AttachmentModel.findOne({ userId, id })
      : await memoryMongo.findOne('attachments', { userId, id });

    if (att) {
      if (isMongoConnected()) {
        await AttachmentModel.updateOne({ userId, id }, { $set: { deletedAt: null, updatedAt: now } });
      } else {
        await memoryMongo.updateOne('attachments', { userId, id }, { $set: { deletedAt: null, updatedAt: now } });
      }
      return res.json({ success: true, restoredId: id, entityType: 'ATTACHMENT' });
    }

    return res.status(404).json({ error: 'Item not found in trash.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed restoring item.', detail: err.message });
  }
});

router.delete('/trash/:id/permanent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    if (isMongoConnected()) {
      await PageModel.deleteMany({ userId, $or: [{ id }, { parentId: id }] });
      await AttachmentModel.deleteOne({ userId, id });
    } else {
      await memoryMongo.deleteMany('pages', { userId, $or: [{ id }, { parentId: id }] });
      await memoryMongo.deleteOne('attachments', { userId, id });
    }

    return res.json({ success: true, permanentlyDeletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed permanently deleting item.', detail: err.message });
  }
});

export default router;
