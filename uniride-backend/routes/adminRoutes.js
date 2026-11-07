import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";
import {
  dashboard, users, drivers, vehicles, rides, deliveries, payments, feedback,
  auditLogs, roles, updateUserStatus, updateDriverVerification, getPricing,
  updatePricing, notifications, markNotificationRead, reports
} from "../controllers/adminController.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/dashboard", dashboard);
router.get("/users", users);
router.patch("/users/:id/status", updateUserStatus);
router.get("/drivers", drivers);
router.patch("/drivers/:id/verification", updateDriverVerification);
router.get("/vehicles", vehicles);
router.get("/rides", rides);
router.get("/deliveries", deliveries);
router.get("/payments", payments);
router.get("/pricing", getPricing);
router.patch("/pricing", updatePricing);
router.get("/feedback", feedback);
router.get("/reports", reports);
router.get("/notifications", notifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.get("/audit-logs", auditLogs);
router.get("/roles", roles);
export default router;
