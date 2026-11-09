import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register, registerStudent, registerDriver, requestPasswordReset, verifyPasswordReset, resetPassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/register', registerLimit, asyncHandler(register));
router.post('/register/student', registerLimit, asyncHandler(registerStudent));
router.post('/register/driver', registerLimit, asyncHandler(registerDriver));
router.post('/register/rider', registerLimit, asyncHandler(registerDriver));
router.post('/login', loginLimit, asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
router.post('/forgot-password', loginLimit, asyncHandler(requestPasswordReset));
router.post('/verify-reset-code', loginLimit, asyncHandler(verifyPasswordReset));
router.post('/reset-password', loginLimit, asyncHandler(resetPassword));
export default router;
