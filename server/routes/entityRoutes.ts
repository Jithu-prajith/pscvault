import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  NotebookModel, PageModel, AttachmentModel
} from '../models/schemas';

const router = Router();

// ==================================================
// NOTEBOOKS CRUD
// ==================================================
router.post('/notebooks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, workspaceId, name, icon, color, position } = req.body;

    const nb = await NotebookModel.create({
      id,
      userId,
      workspaceId,
      name,
      icon: icon || '📚',
      color: color || '#6366f1',
      position: position || 'a0',
    });

    return res.status(201).json(nb);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating notebook.', detail: err.message });
  }
});

router.get('/notebooks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const nbs = await NotebookModel.find({ userId, deletedAt: null }).sort({ position: 1 });
    return res.json(nbs);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching notebooks.', detail: err.message });
  }
});

router.patch('/notebooks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    await NotebookModel.updateOne({ userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    const updated = await NotebookModel.findOne({ userId, id });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed updating notebook.', detail: err.message });
  }
});

router.delete('/notebooks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    await NotebookModel.updateOne({ userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
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

    const page = await PageModel.create(payload);
    return res.status(201).json(page);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating page.', detail: err.message });
  }
});

router.get('/pages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const page = await PageModel.findOne({ userId, id });
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

    await PageModel.updateOne({ userId, id }, { $set: { ...req.body, updatedAt: new Date() } });
    const updated = await PageModel.findOne({ userId, id });
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

    // Cascade soft delete
    await PageModel.updateMany(
      { userId, $or: [{ id }, { parentId: id }] },
      { $set: { deletedAt: now, updatedAt: now } }
    );

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

    const att = await AttachmentModel.create(payload);
    return res.status(201).json(att);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed creating attachment.', detail: err.message });
  }
});

router.get('/attachments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const att = await AttachmentModel.findOne({ userId, id });
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

    await AttachmentModel.updateOne({ userId, id }, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
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
    const deletedPages = await PageModel.find({ userId, deletedAt: { $ne: null } }).sort({ updatedAt: -1 });
    const deletedAtts = await AttachmentModel.find({ userId, deletedAt: { $ne: null } }).sort({ updatedAt: -1 });

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

    // Check page
    const page = await PageModel.findOne({ userId, id });
    if (page) {
      await PageModel.updateMany(
        { userId, $or: [{ id }, { parentId: id }] },
        { $set: { deletedAt: null, updatedAt: now } }
      );
      return res.json({ success: true, restoredId: id, entityType: 'PAGE' });
    }

    // Check attachment
    const att = await AttachmentModel.findOne({ userId, id });
    if (att) {
      await AttachmentModel.updateOne({ userId, id }, { $set: { deletedAt: null, updatedAt: now } });
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

    await PageModel.deleteMany({ userId, $or: [{ id }, { parentId: id }] });
    await AttachmentModel.deleteOne({ userId, id });

    return res.json({ success: true, permanentlyDeletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed permanently deleting item.', detail: err.message });
  }
});

export default router;
