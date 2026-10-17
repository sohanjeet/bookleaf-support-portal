import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sseService } from '../services/sseService.js';
import { AuthUserPayload } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bookleaf_super_secret_jwt_key_2026_dev';

router.get('/stream', (req: Request, res: Response): void => {
  const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication token required for real-time stream' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    const clientId = `client_${decoded.userId}_${Date.now()}`;

    sseService.addClient(clientId, decoded.userId, decoded.role, decoded.authorId, res);

    // Keep-alive heartbeat every 25 seconds to prevent browser/proxy timeouts
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseService.removeClient(clientId);
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;
