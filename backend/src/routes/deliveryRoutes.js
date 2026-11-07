import { Router } from 'express';
import { listDeliveries, acceptDelivery, updateDeliveryStatus } from '../controllers/deliveryController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler(listDeliveries));
router.post('/:id/accept', asyncHandler(acceptDelivery));
router.patch('/:id/status', asyncHandler(updateDeliveryStatus));
export default router;
