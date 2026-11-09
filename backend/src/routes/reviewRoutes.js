import { Router } from 'express';
import protect, { requireRole } from '../middleware/auth.js';
import { createReview, listReviews } from '../controllers/reviewController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(protect, requireRole('rider'));
router.get('/', asyncHandler(listReviews));
router.post('/', asyncHandler(createReview));
export default router;
