import { Router, Request, Response } from 'express';
import path from 'path';
import { authenticateJWT } from '../middleware/auth.js';
import { db } from '../db/database.js';

const router = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

router.use(authenticateJWT);

// GET /uploads/<filename>: admins may read any ticket attachment; authors only their own tickets'.
router.get('/:filename', (req: Request, res: Response): void => {
  const user = req.user!;
  const requested = req.params.filename;
  const notFound = () => res.status(404).json({ success: false, message: 'Attachment not found.' });

  // Reject anything that is not a bare file name (path traversal, separators, NUL bytes).
  if (requested !== path.basename(requested) || requested.includes('\0') || requested.startsWith('.')) {
    notFound();
    return;
  }

  // Only files referenced by a ticket can be served; the ticket decides who may read it.
  const ticket = db.getTickets().find(t => t.attachment_url === `/uploads/${requested}`);
  if (!ticket) {
    notFound();
    return;
  }
  if (user.role !== 'admin' && !(user.role === 'author' && user.authorId && ticket.author_id === user.authorId)) {
    // Same response as a missing file so ownership is not revealed.
    notFound();
    return;
  }

  const filePath = path.resolve(uploadDir, requested);
  if (!filePath.startsWith(uploadDir + path.sep)) {
    notFound();
    return;
  }

  res.setHeader('Content-Type', CONTENT_TYPES[path.extname(requested).toLowerCase()] ?? 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(filePath, err => {
    if (err && !res.headersSent) notFound();
  });
});

export default router;
