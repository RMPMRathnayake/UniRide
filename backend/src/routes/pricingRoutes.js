import { Router } from 'express';
import { getPublicPricing } from '../controllers/pricingController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(getPublicPricing));
export default router;
