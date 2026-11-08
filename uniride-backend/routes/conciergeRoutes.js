import express from 'express';
import {
  resolveDemoActor,
  requireRole,
} from '../middleware/authMiddleware.js';
import { createDiscoveryRateLimiter } from '../middleware/rateLimiter.js';
import {
  getDemoIdentities,
  getDiscoveredShops,
  getMasterCatalog,
  calculateEstimate,
  createConciergeOrder,
  listConciergeOrders,
  getConciergeOrderById,
  getRiderProfile,
  updateRiderStatusAndLocation,
  getAvailableJobsForRider,
  acceptOrderAtomically,
  startShopping,
  submitRiderQuote,
  approveRiderQuote,
  declineRiderQuote,
  uploadOrderReceipt,
  viewOrderReceipt,
  markOrderPurchased,
  markOutForDelivery,
  completeDeliveryAndSettle,
  cancelConciergeOrder,
  reportOrderException,
} from '../controllers/conciergeController.js';

const router = express.Router();

// Resolve demonstration actor identity on all concierge routes
router.use(resolveDemoActor);

// 1. Public / Demo Identity Discovery
router.get('/identities', getDemoIdentities);

// 2. OpenStreetMap / Overpass Nearby Shop Discovery (Rate-limited + Coordinate-validated)
router.get(
  '/discovery/shops',
  createDiscoveryRateLimiter(),
  getDiscoveredShops
);

// 3. Generic Master Catalog Templates (Estimated prices, never verified inventory)
router.get('/catalog', getMasterCatalog);

// 4. Authoritative Backend Estimate Calculator (LKR integer minor units)
router.post('/estimate', calculateEstimate);

// 5. Rider Profile, Online Status, Location & Available Jobs Board
router.get(
  '/rider/profile',
  requireRole('rider', 'admin'),
  getRiderProfile
);
router.patch(
  '/rider/status',
  requireRole('rider', 'admin'),
  updateRiderStatusAndLocation
);
router.get(
  '/jobs/available',
  requireRole('rider', 'admin'),
  getAvailableJobsForRider
);

// 6. Concierge Order Creation & Scoped Listing
router.post(
  '/orders',
  requireRole('customer', 'admin'),
  createConciergeOrder
);
router.get(
  '/orders',
  requireRole('customer', 'rider', 'admin'),
  listConciergeOrders
);
router.get(
  '/orders/:orderId',
  requireRole('customer', 'rider', 'admin'),
  getConciergeOrderById
);

// 7. Rider Atomic Claim & Shopping Lifecycle Actions
router.post(
  '/orders/:orderId/accept',
  requireRole('rider', 'admin'),
  acceptOrderAtomically
);
router.post(
  '/orders/:orderId/start-shopping',
  requireRole('rider', 'admin'),
  startShopping
);
router.post(
  '/orders/:orderId/quote',
  requireRole('rider', 'admin'),
  submitRiderQuote
);

// 8. Customer Quote Approval / Decline
router.post(
  '/orders/:orderId/approve-quote',
  requireRole('customer', 'admin'),
  approveRiderQuote
);
router.post(
  '/orders/:orderId/decline-quote',
  requireRole('customer', 'admin'),
  declineRiderQuote
);

// 9. Receipt Upload (Size & Magic-Byte Validated) & Protected Viewing
router.post(
  '/orders/:orderId/receipt',
  requireRole('rider', 'admin'),
  uploadOrderReceipt
);
router.get(
  '/orders/:orderId/receipt',
  requireRole('customer', 'rider', 'admin'),
  viewOrderReceipt
);

// 10. Purchase, Delivery & Idempotent COD Financial Settlement
router.post(
  '/orders/:orderId/purchase',
  requireRole('rider', 'admin'),
  markOrderPurchased
);
router.post(
  '/orders/:orderId/out-for-delivery',
  requireRole('rider', 'admin'),
  markOutForDelivery
);
router.post(
  '/orders/:orderId/deliver',
  requireRole('rider', 'admin'),
  completeDeliveryAndSettle
);

// 11. Cancellation & Post-Purchase Exception / Support Flow
router.post(
  '/orders/:orderId/cancel',
  requireRole('customer', 'rider', 'admin'),
  cancelConciergeOrder
);
router.post(
  '/orders/:orderId/support-exception',
  requireRole('customer', 'rider', 'admin'),
  reportOrderException
);

export default router;
