import { Router } from 'express';
import { generateDraftResponse, getKnowledgeBase } from '../controllers/aiController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateJWT);

// Admin-only endpoints for AI drafting and KB inspection
router.post('/draft-response', requireRole(['admin']), generateDraftResponse);
router.get('/knowledge-base', requireRole(['admin']), getKnowledgeBase);

export default router;
