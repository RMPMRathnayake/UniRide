import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  dashboard, users, drivers, vehicles, rides, deliveries, payments, feedback, auditLogs, roles,
  updateUserStatus, updateDriverVerification, getPricing, updatePricing, notifications, markNotificationRead, reports
} from '../controllers/adminController.js';
const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/dashboard', asyncHandler(dashboard));
router.get('/users', asyncHandler(users));
router.patch('/users/:id/status', asyncHandler(updateUserStatus));
router.get('/drivers', asyncHandler(drivers));
router.patch('/drivers/:id/verification', asyncHandler(updateDriverVerification));
router.get('/vehicles', asyncHandler(vehicles));
router.get('/rides', asyncHandler(rides));
router.get('/deliveries', asyncHandler(deliveries));
router.get('/payments', asyncHandler(payments));
router.get('/pricing', asyncHandler(getPricing));
router.patch('/pricing', asyncHandler(updatePricing));
router.get('/feedback', asyncHandler(feedback));
router.get('/reports', asyncHandler(reports));
router.get('/notifications', asyncHandler(notifications));
router.patch('/notifications/:id/read', asyncHandler(markNotificationRead));
router.get('/audit-logs', asyncHandler(auditLogs));
router.get('/roles', asyncHandler(roles));
export default router;
