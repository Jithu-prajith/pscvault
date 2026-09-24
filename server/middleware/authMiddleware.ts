import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ [SECURITY WARNING]: JWT_SECRET environment variable is not defined in production!');
    }
    return 'pscvault_dev_default_jwt_secret_do_not_use_in_production';
  }
  return secret;
};

export const JWT_SECRET = getJwtSecret();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    deviceId?: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; deviceId?: string };
    
    // Attach authenticated identity derived strictly from JWT
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      deviceId: (req.headers['x-device-id'] as string) || decoded.deviceId || 'unknown-device',
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}
