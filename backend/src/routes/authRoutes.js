import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
export default router;
