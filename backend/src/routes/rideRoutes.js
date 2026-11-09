import { Router } from 'express';
import protect, { requireRole } from '../middleware/auth.js';
import { acceptRide, cancelRiderRide, createRiderRide, listDriverRides, listRiderRides, updateDriverRideStatus } from '../controllers/rideController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
router.get('/', asyncHandler((req, res) => req.role === 'driver' ? listDriverRides(req, res) : listRiderRides(req, res)));
router.post('/', requireRole('rider'), asyncHandler(createRiderRide));
router.post('/:id/accept', requireRole('driver'), asyncHandler(acceptRide));
router.patch('/:id/status', asyncHandler((req, res) => req.role === 'driver' ? updateDriverRideStatus(req, res) : cancelRiderRide(req, res)));
export default router;
