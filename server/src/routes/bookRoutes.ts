import { Router } from 'express';
import { getMyBooks, getBookDetails } from '../controllers/bookController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMyBooks);
router.get('/:id', getBookDetails);

export default router;
