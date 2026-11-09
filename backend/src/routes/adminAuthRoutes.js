import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, adminMe } from '../controllers/adminAuthController.js';
import { requireAuth } from '../middleware/adminAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), asyncHandler(adminLogin));
router.get('/me', requireAuth, asyncHandler(adminMe));
export default router;
