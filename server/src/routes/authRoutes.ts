import { Router } from 'express';
import { login, getMe, getDemoAccounts } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
