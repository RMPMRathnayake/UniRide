import { Router } from 'express';
import { listRides, acceptRide, updateRideStatus } from '../controllers/rideController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler(listRides));
router.post('/:id/accept', asyncHandler(acceptRide));
router.patch('/:id/status', asyncHandler(updateRideStatus));
export default router;
