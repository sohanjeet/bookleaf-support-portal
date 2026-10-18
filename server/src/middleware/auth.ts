import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.js';
import { JWT_SECRET } from '../config.js';

export interface AuthUserPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  authorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}


export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'AuthenticationRequired',
      message: 'Access token missing or invalid. Please log in.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      error: 'InvalidToken',
      message: 'Token is invalid or has expired. Please re-authenticate.'
    });
    return;
  }
};
