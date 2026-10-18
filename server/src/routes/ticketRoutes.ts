import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addMessage,
  addInternalNote
} from '../controllers/ticketController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

// Setup file upload folder
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Extension comes from the validated MIME type, never from the client-supplied filename.
    const ext = file.mimetype === 'application/pdf' ? '.pdf' : file.mimetype === 'image/png' ? '.png' : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/(png|jpe?g)|application\/pdf)$/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(Object.assign(new Error('Only PNG, JPG or PDF attachments are supported.'), { statusCode: 400 }));
  }
});

const router = Router();

router.use(authenticateJWT);

// Ticket endpoints
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', upload.single('attachment'), createTicket);

// Admin-only updates (status, priority override, category override, assignee)
router.patch('/:id', requireRole(['admin']), updateTicket);

// Messages: both author and admin can send messages
router.post('/:id/messages', addMessage);

// Internal notes: admin-only
router.post('/:id/notes', requireRole(['admin']), addInternalNote);

export default router;
