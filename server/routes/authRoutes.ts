import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UserModel } from '../models/schemas';
import { memoryMongo } from '../models/memoryStore';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/authMiddleware';

const router = Router();

function sanitizeUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

// 1. POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, targetExamYear, deviceId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const emailKey = email.toLowerCase().trim();
    const existing = isMongoConnected()
      ? await UserModel.findOne({ email: emailKey })
      : await memoryMongo.findOne('users', { email: emailKey });

    if (existing) {
      return res.status(400).json({ error: 'An account already exists with this email address.' });
    }

    const userId = sanitizeUserId(emailKey);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userObj = {
      userId,
      name: name.trim(),
      email: emailKey,
      passwordHash,
      targetExamYear: targetExamYear || '2027',
    };

    if (isMongoConnected()) {
      await UserModel.create(userObj);
    } else {
      await memoryMongo.create('users', userObj);
    }

    const token = jwt.sign(
      { userId, email: emailKey, deviceId: deviceId || 'desktop-main' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name: userObj.name,
        email: userObj.email,
        preferences: { theme: 'light', onboardingCompleted: false, targetExamYear: userObj.targetExamYear },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed creating account.', detail: err.message });
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, deviceId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailKey = email.toLowerCase().trim();
    const user: any = isMongoConnected()
      ? await UserModel.findOne({ email: emailKey })
      : await memoryMongo.findOne('users', { email: emailKey });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, deviceId: deviceId || 'device-main' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        preferences: { theme: 'light', onboardingCompleted: true, targetExamYear: user.targetExamYear || '2027' },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed logging in.', detail: err.message });
  }
});

// 3. POST /api/auth/logout
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 4. POST /api/auth/refresh
router.post('/refresh', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const token = jwt.sign(
    { userId: req.user.userId, email: req.user.email, deviceId: req.user.deviceId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({ success: true, token });
});

// 5. GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user: any = isMongoConnected()
      ? await UserModel.findOne({ userId: req.user.userId })
      : await memoryMongo.findOne('users', { userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      id: user.userId,
      name: user.name,
      email: user.email,
      preferences: { theme: 'light', onboardingCompleted: true, targetExamYear: user.targetExamYear || '2027' },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed fetching profile.', detail: err.message });
  }
});

export default router;
