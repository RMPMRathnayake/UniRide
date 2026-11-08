import ConciergeOrder from '../models/ConciergeOrder.js';
import MasterCatalogItem from '../models/MasterCatalogItem.js';
import Rider from '../models/Rider.js';
import SettlementLedger from '../models/SettlementLedger.js';
import {
  DEMO_IDENTITIES,
  createDemoSessionToken,
} from '../middleware/authMiddleware.js';
import {
  validateCoordinates,
  validateRadiusMeters,
  calculateStraightLineDistanceMeters,
  computeDistanceMetrics,
} from '../services/geoUtils.js';
import { discoverNearbyShops } from '../services/discoveryService.js';
import {
  validateOrderTransition,
  calculateBackendPricing,
  POST_PURCHASE_STATES,
} from '../services/orderStateMachine.js';
import {
  saveValidatedReceipt,
  readReceiptFromStorage,
} from '../services/receiptStorage.js';
import { settleDeliveredConciergeOrder } from '../services/settlementService.js';

const RIDER_LOCATION_MAX_AGE_MS = Number(
  process.env.RIDER_LOCATION_MAX_AGE_MS || 2 * 60 * 60 * 1000 // 2 hours
);
const QUOTE_APPROVAL_TTL_MS = Number(
  process.env.QUOTE_APPROVAL_TTL_MS || 30 * 60 * 1000 // 30 minutes
);

/**
 * Redacts private customer address and contact details from an order
 * when viewed by an unassigned rider browsing the job board.
 */
function sanitizeOrderForActor(order, actor) {
  if (!order) return null;
  const isOwner = actor?.role === 'customer' && order.customerId === actor.id;
  const isAssignedRider =
    actor?.role === 'rider' &&
    order.assignedRiderId &&
    order.assignedRiderId === actor.id;
  const isAdmin = actor?.role === 'admin';

  if (isOwner || isAssignedRider || isAdmin) {
    return order;
  }

  // Unassigned rider browsing REQUESTED jobs: hide private customer address & phone
  return {
    orderId: order.orderId,
    status: order.status,
    deliveryAreaPublic: order.deliveryAreaPublic,
    deliveryAddress: '[Hidden until job is accepted]',
    customerName: 'SEUSL Student Customer',
    customerPhone: '[Hidden until job is accepted]',
    deliveryInstructions: '[Revealed after assignment]',
    shop: order.shop,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    items: (order.items || []).map((i) => ({
      itemId: i.itemId,
      name: i.name,
      requestedQuantity: i.requestedQuantity,
      unitLabel: i.unitLabel,
      isCustomRequest: i.isCustomRequest,
    })),
    pricing: order.pricing,
    substitutionPolicy: order.substitutionPolicy,
    createdAt: order.createdAt,
  };
}

/**
 * GET /api/concierge/identities
 * Returns the clearly labeled local demonstration identities for Customer, Rider, and Admin roles.
 */
export const getDemoIdentities = async (_req, res) => {
  const list = Object.values(DEMO_IDENTITIES).map((ident) => ({
    ...ident,
    sessionToken: createDemoSessionToken(ident.id),
  }));

  return res.status(200).json({
    success: true,
    authMode: 'local_demonstration_identity',
    notice:
      'Local Demonstration Identity Flow for prototype evaluation. Switch between Customer, Student Rider, and Admin sessions.',
    data: list,
  });
};

/**
 * GET /api/concierge/discovery/shops?lat=&lng=&radius=&category=&q=&refresh=
 * Validates coordinates on server and queries Overpass with caching, deduplication, and stale fallback.
 */
export const getDiscoveredShops = async (req, res) => {
  try {
    const coordCheck = validateCoordinates(req.query.lat, req.query.lng);
    if (!coordCheck.valid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_COORDINATES',
        message: coordCheck.error,
      });
    }

    const radiusCheck = validateRadiusMeters(req.query.radius);
    if (!radiusCheck.valid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RADIUS',
        message: radiusCheck.error,
      });
    }

    const category = (req.query.category || 'all').trim().toLowerCase();
    const searchQuery = (req.query.q || '').trim();
    const forceRefresh = req.query.refresh === 'true';

    const result = await discoverNearbyShops({
      lat: coordCheck.lat,
      lng: coordCheck.lng,
      radiusMeters: radiusCheck.radiusMeters,
      category,
      searchQuery,
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.status || 503;
    return res.status(status).json({
      success: false,
      code: error.code || 'DISCOVERY_UNAVAILABLE',
      providerAvailable: false,
      message:
        error.message ||
        'Nearby shop discovery is temporarily unavailable. Please try again shortly.',
    });
  }
};

/**
 * GET /api/concierge/catalog?category=stationery|grocery|pharmacy|food
 * Returns generic shopping templates (never labeled as verified store inventory).
 */
export const getMasterCatalog = async (req, res) => {
  try {
    const category = (req.query.category || '').trim().toLowerCase();

    if (category === 'pharmacy') {
      return res.status(200).json({
        success: true,
        category: 'pharmacy',
        isVerifiedInventory: false,
        catalogNotice:
          'Pharmacies are discoverable places only. We do not generate automatic medicine catalogs. You may submit custom requests for everyday non-prescription personal care items.',
        data: [],
      });
    }

    if (category === 'food') {
      return res.status(200).json({
        success: true,
        category: 'food',
        isVerifiedInventory: false,
        catalogNotice:
          'Independent restaurants and cafés discovered via OpenStreetMap do not have verified menus or fixed prices here. Add custom dish requests below and your student rider will confirm availability and actual price before purchasing.',
        data: [],
      });
    }

    const filter = {};
    if (category && ['stationery', 'grocery'].includes(category)) {
      filter.category = category;
    }

    const items = await MasterCatalogItem.find(filter)
      .sort({ category: 1, section: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      isVerifiedInventory: false,
      catalogNotice:
        'Generic shopping templates with estimated prices. Actual availability and prices are confirmed at the shop by your student rider.',
      count: items.length,
      data: items.map((item) => ({
        ...item,
        isVerifiedInventory: false,
        priceLabel: 'Estimated price',
        availabilityLabel: 'Availability confirmed by rider',
        imageLabel: 'Illustrative image',
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load master catalog templates.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/estimate
 * Computes authoritative backend estimate in LKR integer minor units.
 */
export const calculateEstimate = async (req, res) => {
  try {
    const { items = [], shopCoordinates, deliveryCoordinates } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_ITEMS',
        message: 'At least one item is required to calculate an estimate.',
      });
    }

    let straightLineDistanceMeters = 1000;
    if (shopCoordinates && deliveryCoordinates) {
      const sCheck = validateCoordinates(
        shopCoordinates.lat,
        shopCoordinates.lng
      );
      const dCheck = validateCoordinates(
        deliveryCoordinates.lat,
        deliveryCoordinates.lng
      );
      if (sCheck.valid && dCheck.valid) {
        straightLineDistanceMeters = calculateStraightLineDistanceMeters(
          sCheck.lat,
          sCheck.lng,
          dCheck.lat,
          dCheck.lng
        );
      }
    }

    const pricing = calculateBackendPricing({
      items,
      straightLineDistanceMeters,
      useConfirmedPrices: false,
    });

    return res.status(200).json({
      success: true,
      straightLineDistanceMeters,
      pricing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate order estimate.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders
 * Creates a new concierge shopping request (idempotent by customerId + idempotencyKey).
 */
export const createConciergeOrder = async (req, res) => {
  try {
    const actor = req.actor;
    const body = req.body || {};

    const idempotencyKey = String(body.idempotencyKey || '').trim();
    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'idempotencyKey is required to prevent duplicate orders.',
      });
    }

    // 1. Check idempotent replay first
    const existingOrder = await ConciergeOrder.findOne({
      customerId: actor.id,
      idempotencyKey,
    }).lean();

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        idempotentReplay: true,
        data: existingOrder,
      });
    }

    // 2. Validate customer delivery coordinates
    const delivCheck = validateCoordinates(
      body.deliveryCoordinates?.lat,
      body.deliveryCoordinates?.lng
    );
    if (!delivCheck.valid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_DELIVERY_COORDINATES',
        message: `Invalid delivery coordinates: ${delivCheck.error}`,
      });
    }

    // 3. Validate single shop details & coordinates
    const shopInput = body.shop;
    if (!shopInput || !shopInput.externalId || !shopInput.name) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SHOP',
        message: 'A valid target shop (externalId and name) is required.',
      });
    }

    const shopCoordCheck = validateCoordinates(
      shopInput.coordinates?.lat ?? shopInput.lat,
      shopInput.coordinates?.lng ?? shopInput.lng
    );
    if (!shopCoordCheck.valid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SHOP_COORDINATES',
        message: `Invalid shop coordinates: ${shopCoordCheck.error}`,
      });
    }

    const deliveryAddress = String(body.deliveryAddress || '').trim();
    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_DELIVERY_ADDRESS',
        message: 'Delivery address is required.',
      });
    }

    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_ORDER_ITEMS',
        message: 'Order must include at least one item.',
      });
    }

    // Enforce one shop per order
    const distinctShops = new Set(
      rawItems
        .map((i) => i.shopExternalId)
        .filter((id) => id && id !== shopInput.externalId)
    );
    if (distinctShops.size > 0) {
      return res.status(400).json({
        success: false,
        code: 'MULTIPLE_SHOPS_NOT_ALLOWED',
        message: 'Only one shop per concierge order is supported.',
      });
    }

    const orderSubPolicy = [
      'NO_SUBSTITUTIONS',
      'ASK_FIRST',
      'ALLOW_WITHIN_BUDGET',
    ].includes(body.substitutionPolicy)
      ? body.substitutionPolicy
      : 'ASK_FIRST';

    // 4. Build immutable snapshot of requested items using authoritative template prices when applicable
    const templateIds = rawItems
      .map((i) => i.templateId)
      .filter(Boolean);
    const dbTemplates =
      templateIds.length > 0
        ? await MasterCatalogItem.find({ id: { $in: templateIds } }).lean()
        : [];
    const templateMap = new Map(dbTemplates.map((t) => [t.id, t]));

    const snapshotItems = [];
    for (let idx = 0; idx < rawItems.length; idx++) {
      const raw = rawItems[idx];
      const qty = Math.round(Number(raw.requestedQuantity ?? raw.qty ?? 1));
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ITEM_QUANTITY',
          message: `Item #${idx + 1} must have an integer quantity between 1 and 100.`,
        });
      }

      const tpl = raw.templateId ? templateMap.get(raw.templateId) : null;
      const itemName = String(tpl ? tpl.name : raw.name || '').trim();
      if (!itemName) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_ITEM_NAME',
          message: `Item #${idx + 1} is missing a name.`,
        });
      }

      const estimatedUnitPriceMinor = tpl
        ? tpl.estimatedUnitPriceMinor
        : Math.round(Number(raw.estimatedUnitPriceMinor ?? 0));

      if (
        !Number.isInteger(estimatedUnitPriceMinor) ||
        estimatedUnitPriceMinor < 0
      ) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ESTIMATED_PRICE',
          message: `Item "${itemName}" must have a non-negative integer estimatedUnitPriceMinor.`,
        });
      }

      const itemSubPolicy = [
        'NO_SUBSTITUTIONS',
        'ASK_FIRST',
        'ALLOW_WITHIN_BUDGET',
      ].includes(raw.substitutionPolicy)
        ? raw.substitutionPolicy
        : orderSubPolicy;

      snapshotItems.push({
        itemId: raw.itemId || `item-${idx + 1}-${Date.now()}`,
        isCustomRequest: !tpl,
        templateId: tpl ? tpl.id : null,
        name: itemName,
        unitLabel: tpl ? tpl.unitLabel : String(raw.unitLabel || '1 unit'),
        requestedQuantity: qty,
        preferredBrand: String(raw.preferredBrand || '').trim(),
        customerNotes: String(raw.customerNotes || raw.notes || '').trim(),
        referenceImageUrl: String(raw.referenceImageUrl || '').trim(),
        substitutionPolicy: itemSubPolicy,
        estimatedUnitPriceMinor,
        estimatedLineTotalMinor: estimatedUnitPriceMinor * qty,
        isVerifiedInventory: false,
        priceLabel: 'Estimated price',
        availabilityLabel: 'Availability confirmed by rider',
        availabilityStatus: 'PENDING',
        confirmedQuantity: 0,
        actualUnitPriceMinor: null,
        actualLineTotalMinor: 0,
      });
    }

    const distanceMetrics = computeDistanceMetrics(
      delivCheck.lat,
      delivCheck.lng,
      shopCoordCheck.lat,
      shopCoordCheck.lng
    );

    const pricing = calculateBackendPricing({
      items: snapshotItems,
      straightLineDistanceMeters: distanceMetrics.straightLineDistanceMeters,
      useConfirmedPrices: false,
    });

    const substitutionMaxBudgetMinor = Math.max(
      pricing.estimatedTotalMinor,
      Math.round(
        Number(body.substitutionMaxBudgetMinor || pricing.estimatedTotalMinor)
      )
    );

    const orderId = `CONC-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const areaShort =
      deliveryAddress.split(',')[0]?.trim() || 'SEUSL Campus Area';
    const deliveryAreaPublic = `${areaShort} (~${distanceMetrics.straightLineDistanceKm} km straight-line)`;

    const orderDoc = {
      orderId,
      idempotencyKey,
      customerId: actor.id,
      customerName: actor.name,
      customerPhone: body.customerPhone || actor.phone || '',
      deliveryAddress,
      deliveryAreaPublic,
      deliveryCoordinates: {
        lat: delivCheck.lat,
        lng: delivCheck.lng,
      },
      deliveryInstructions: String(body.deliveryInstructions || '').trim(),
      shop: {
        externalId: shopInput.externalId,
        name: shopInput.name,
        category: shopInput.category || 'grocery',
        storeType: shopInput.storeType || 'independent_osm',
        isIndependent: shopInput.isIndependent !== false,
        conciergeNotice:
          'An independent rider shops here on your behalf. Prices and availability are confirmed before purchase.',
        address:
          shopInput.address?.formatted ||
          (typeof shopInput.address === 'string' ? shopInput.address : '') ||
          '',
        coordinates: {
          lat: shopCoordCheck.lat,
          lng: shopCoordCheck.lng,
        },
        straightLineDistanceMeters: distanceMetrics.straightLineDistanceMeters,
        estimatedRoadDistanceKm: distanceMetrics.estimatedRoadDistanceKm,
      },
      substitutionPolicy: orderSubPolicy,
      substitutionMaxBudgetMinor,
      items: snapshotItems,
      pricing: {
        currency: 'LKR',
        estimatedItemSubtotalMinor: pricing.estimatedItemSubtotalMinor,
        confirmedItemSubtotalMinor: 0,
        deliveryFeeMinor: pricing.deliveryFeeMinor,
        serviceFeeMinor: pricing.serviceFeeMinor,
        estimatedTotalMinor: pricing.estimatedTotalMinor,
        approvedMaxAmountMinor: 0,
        finalAmountDueMinor: 0,
      },
      paymentMethod:
        body.paymentMethod === 'SIMULATED_CARD_PROTOTYPE'
          ? 'SIMULATED_CARD_PROTOTYPE'
          : 'COD',
      status: 'REQUESTED',
      history: [
        {
          fromStatus: null,
          toStatus: 'REQUESTED',
          actorRole: actor.role,
          actorId: actor.id,
          actorName: actor.name,
          reason: 'Customer created concierge shopping request.',
          metadata: {
            estimatedTotalMinor: pricing.estimatedTotalMinor,
            itemCount: snapshotItems.length,
          },
          timestamp: new Date(),
        },
      ],
    };

    try {
      const created = await ConciergeOrder.create(orderDoc);
      return res.status(201).json({
        success: true,
        idempotentReplay: false,
        data: created.toObject(),
      });
    } catch (dbErr) {
      // Handle concurrent duplicate key on { customerId, idempotencyKey }
      if (dbErr.code === 11000) {
        const replay = await ConciergeOrder.findOne({
          customerId: actor.id,
          idempotencyKey,
        }).lean();
        if (replay) {
          return res.status(200).json({
            success: true,
            idempotentReplay: true,
            data: replay,
          });
        }
      }
      throw dbErr;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create concierge order.',
      error: error.message,
    });
  }
};

/**
 * GET /api/concierge/orders
 * Lists concierge orders scoped to the authenticated actor's role.
 */
export const listConciergeOrders = async (req, res) => {
  try {
    const actor = req.actor;
    const filter = {};

    if (actor.role === 'customer') {
      filter.customerId = actor.id;
    } else if (actor.role === 'rider') {
      filter.assignedRiderId = actor.id;
    }

    const orders = await ConciergeOrder.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map((o) => sanitizeOrderForActor(o, actor)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch concierge orders.',
      error: error.message,
    });
  }
};

/**
 * GET /api/concierge/orders/:orderId
 * Retrieves a single concierge order with strict ownership & assignment enforcement.
 */
export const getConciergeOrderById = async (req, res) => {
  try {
    const actor = req.actor;
    const { orderId } = req.params;

    const order = await ConciergeOrder.findOne({ orderId }).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `Concierge order ${orderId} not found.`,
      });
    }

    if (actor.role === 'customer' && order.customerId !== actor.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_NOT_ORDER_OWNER',
        message: 'You do not have permission to access another customer’s order.',
      });
    }

    if (actor.role === 'rider' && order.assignedRiderId !== actor.id) {
      if (order.status === 'REQUESTED' && !order.assignedRiderId) {
        return res.status(200).json({
          success: true,
          data: sanitizeOrderForActor(order, actor),
        });
      }
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_NOT_ASSIGNED_RIDER',
        message: 'Only the assigned rider can view this order’s details.',
      });
    }

    const ledgerEntries =
      order.status === 'DELIVERED'
        ? await SettlementLedger.find({ orderId }).sort({ entryId: 1 }).lean()
        : [];

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        ledgerEntries,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order.',
      error: error.message,
    });
  }
};

/**
 * GET /api/concierge/rider/profile
 * Returns the rider's availability, last-known location, active assignment, and demo ledger entries.
 */
export const getRiderProfile = async (req, res) => {
  try {
    const riderId =
      req.actor.role === 'rider'
        ? req.actor.id
        : req.query.riderId || 'rider-1';

    const rider = await Rider.findOne({ id: riderId }).lean();
    if (!rider) {
      return res.status(404).json({
        success: false,
        code: 'RIDER_NOT_FOUND',
        message: `Rider ${riderId} not found.`,
      });
    }

    const ledgerEntries = await SettlementLedger.find({ riderId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const activeOrder = rider.activeOrderId
      ? await ConciergeOrder.findOne({ orderId: rider.activeOrderId }).lean()
      : null;

    return res.status(200).json({
      success: true,
      data: {
        rider,
        activeOrder,
        ledgerEntries,
        walletNotice:
          'demoLedgerBalanceMinor represents demonstration ledger credit for delivery earnings and reimbursements, distinct from physical cash spent at a shop.',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rider profile.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/concierge/rider/status
 * Updates rider online status and/or last-known GPS coordinates.
 */
export const updateRiderStatusAndLocation = async (req, res) => {
  try {
    const riderId = req.actor.id;
    const { isOnline, lat, lng } = req.body || {};

    const updateFields = {};
    if (typeof isOnline === 'boolean') {
      updateFields.isOnline = isOnline;
    }

    if (lat !== undefined || lng !== undefined) {
      const coordCheck = validateCoordinates(lat, lng);
      if (!coordCheck.valid) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_RIDER_COORDINATES',
          message: coordCheck.error,
        });
      }
      updateFields.lastKnownLocation = {
        type: 'Point',
        coordinates: [coordCheck.lng, coordCheck.lat],
      };
      updateFields.lastLocationUpdatedAt = new Date();
    }

    const updated = await Rider.findOneAndUpdate(
      { id: riderId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        code: 'RIDER_NOT_FOUND',
        message: `Rider ${riderId} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update rider status.',
      error: error.message,
    });
  }
};

/**
 * GET /api/concierge/jobs/available
 * Returns nearby unassigned jobs for eligible online riders with recent coordinates.
 * Privacy rule: Never discloses full customer delivery address or phone number to browsing riders.
 */
export const getAvailableJobsForRider = async (req, res) => {
  try {
    const rider = await Rider.findOne({ id: req.actor.id }).lean();
    if (!rider) {
      return res.status(404).json({
        success: false,
        code: 'RIDER_NOT_FOUND',
        message: 'Rider profile not found.',
      });
    }

    if (!rider.isOnline) {
      return res.status(200).json({
        success: true,
        eligible: false,
        reason: 'RIDER_OFFLINE',
        message: 'You are currently offline. Go online to receive nearby shopping jobs.',
        data: [],
      });
    }

    const [riderLng, riderLat] = rider.lastKnownLocation?.coordinates || [
      NaN,
      NaN,
    ];
    const locAgeMs = rider.lastLocationUpdatedAt
      ? Date.now() - new Date(rider.lastLocationUpdatedAt).getTime()
      : Infinity;

    if (
      !Number.isFinite(riderLat) ||
      !Number.isFinite(riderLng) ||
      locAgeMs > RIDER_LOCATION_MAX_AGE_MS
    ) {
      return res.status(200).json({
        success: true,
        eligible: false,
        reason: 'STALE_OR_MISSING_RIDER_LOCATION',
        message:
          'Your location coordinates are missing or older than the eligibility window. Please refresh your rider GPS location.',
        data: [],
      });
    }

    const maxJobDistanceMeters = Number(
      req.query.maxDistanceMeters || 15000 // 15 km around rider
    );

    const openOrders = await ConciergeOrder.find({
      status: 'REQUESTED',
      assignedRiderId: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const nearbyJobs = openOrders
      .map((order) => {
        const shopLat = order.shop?.coordinates?.lat;
        const shopLng = order.shop?.coordinates?.lng;
        const distToShopMeters = calculateStraightLineDistanceMeters(
          riderLat,
          riderLng,
          shopLat,
          shopLng
        );
        return {
          ...sanitizeOrderForActor(order, req.actor),
          riderDistanceToShopMeters: distToShopMeters,
          riderDistanceToShopKm: Number((distToShopMeters / 1000).toFixed(2)),
        };
      })
      .filter((job) => job.riderDistanceToShopMeters <= maxJobDistanceMeters)
      .sort((a, b) => a.riderDistanceToShopMeters - b.riderDistanceToShopMeters);

    return res.status(200).json({
      success: true,
      eligible: true,
      hasActiveOrder: Boolean(rider.activeOrderId),
      activeOrderId: rider.activeOrderId,
      riderLocation: {
        lat: riderLat,
        lng: riderLng,
        updatedAt: rider.lastLocationUpdatedAt,
      },
      count: nearbyJobs.length,
      data: nearbyJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load available rider jobs.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/accept
 * Atomically assigns a REQUESTED order to an eligible online rider and enforces
 * at most one active shopping assignment per rider under concurrent requests.
 */
export const acceptOrderAtomically = async (req, res) => {
  const riderId = req.actor.id;
  const { orderId } = req.params;

  try {
    // 1. Verify rider exists, is online, and has recent valid coordinates
    const riderCheck = await Rider.findOne({ id: riderId }).lean();
    if (!riderCheck) {
      return res.status(404).json({
        success: false,
        code: 'RIDER_NOT_FOUND',
        message: 'Rider profile not found.',
      });
    }

    if (!riderCheck.isOnline) {
      return res.status(409).json({
        success: false,
        code: 'RIDER_OFFLINE',
        message: 'Rider must be online to accept an order.',
      });
    }

    const [rLng, rLat] = riderCheck.lastKnownLocation?.coordinates || [
      NaN,
      NaN,
    ];
    const locAgeMs = riderCheck.lastLocationUpdatedAt
      ? Date.now() - new Date(riderCheck.lastLocationUpdatedAt).getTime()
      : Infinity;

    if (
      !Number.isFinite(rLat) ||
      !Number.isFinite(rLng) ||
      locAgeMs > RIDER_LOCATION_MAX_AGE_MS
    ) {
      return res.status(409).json({
        success: false,
        code: 'RIDER_LOCATION_STALE',
        message: 'Rider location must be updated recently before accepting jobs.',
      });
    }

    // 2. Step A: Atomically reserve the rider (enforces 1 active order per rider)
    const reservedRider = await Rider.findOneAndUpdate(
      {
        id: riderId,
        isOnline: true,
        activeOrderId: null,
      },
      {
        $set: {
          activeOrderId: orderId,
          isAvailable: false,
        },
      },
      { new: true }
    ).lean();

    if (!reservedRider) {
      return res.status(409).json({
        success: false,
        code: 'RIDER_ALREADY_HAS_ACTIVE_ASSIGNMENT',
        message:
          'You already have an active shopping assignment. Complete or resolve it before accepting another job.',
      });
    }

    // 3. Step B: Atomically claim the order ONLY if it is still REQUESTED and unassigned
    const now = new Date();
    const transitionEntry = {
      fromStatus: 'REQUESTED',
      toStatus: 'ASSIGNED',
      actorRole: 'rider',
      actorId: riderId,
      actorName: reservedRider.name,
      reason: 'Student rider accepted shopping assignment.',
      metadata: { vehicle: reservedRider.vehicle },
      timestamp: now,
    };

    const claimedOrder = await ConciergeOrder.findOneAndUpdate(
      {
        orderId,
        status: 'REQUESTED',
        assignedRiderId: null,
      },
      {
        $set: {
          status: 'ASSIGNED',
          assignedRiderId: riderId,
          assignedRiderName: reservedRider.name,
          assignedRiderPhone: reservedRider.phone,
          assignedRiderVehicle: reservedRider.vehicle,
          assignedAt: now,
        },
        $push: {
          history: transitionEntry,
        },
      },
      { new: true }
    ).lean();

    // If another rider claimed the order concurrently, roll back Step A immediately
    if (!claimedOrder) {
      await Rider.updateOne(
        { id: riderId, activeOrderId: orderId },
        {
          $set: {
            activeOrderId: null,
            isAvailable: true,
          },
        }
      );

      return res.status(409).json({
        success: false,
        code: 'ORDER_ALREADY_CLAIMED',
        message:
          'This order has already been accepted by another rider or is no longer available.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order successfully assigned to you.',
      data: claimedOrder,
    });
  } catch (error) {
    // Safety rollback if unexpected error occurred mid-flight
    await Rider.updateOne(
      { id: riderId, activeOrderId: orderId },
      { $set: { activeOrderId: null, isAvailable: true } }
    ).catch(() => {});

    return res.status(500).json({
      success: false,
      message: 'Failed to accept order.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/start-shopping
 * Assigned rider arrives at the shop and begins checking items.
 */
export const startShopping = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await ConciergeOrder.findOne({ orderId });

    const check = validateOrderTransition(order, 'SHOPPING', req.actor);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    const fromStatus = order.status;
    order.status = 'SHOPPING';
    order.history.push({
      fromStatus,
      toStatus: 'SHOPPING',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: 'Rider arrived at the shop and started checking item availability.',
      timestamp: new Date(),
    });

    await order.save();
    return res.status(200).json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to transition to SHOPPING.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/quote
 * Assigned rider submits an itemized quote of available items, unavailable items,
 * substitutions, and actual shop prices in LKR minor units.
 * Changing a quote increments `quote.version` and invalidates any previous approval.
 */
export const submitRiderQuote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items: quoteItems = [], riderSummaryNote = '' } = req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    const check = validateOrderTransition(
      order,
      'AWAITING_CUSTOMER_APPROVAL',
      req.actor
    );
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    if (!Array.isArray(quoteItems) || quoteItems.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_QUOTE_ITEMS',
        message: 'Itemized quote must include item statuses and actual prices.',
      });
    }

    const quoteMap = new Map(quoteItems.map((q) => [q.itemId, q]));
    let availableOrSubCount = 0;

    for (const item of order.items) {
      const q = quoteMap.get(item.itemId);
      if (!q) {
        return res.status(400).json({
          success: false,
          code: 'INCOMPLETE_QUOTE',
          message: `Missing quote confirmation for item "${item.name}" (${item.itemId}).`,
        });
      }

      const status = q.availabilityStatus;
      if (!['AVAILABLE', 'UNAVAILABLE', 'SUBSTITUTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ITEM_AVAILABILITY_STATUS',
          message: `Item "${item.name}" has invalid availabilityStatus "${status}". Must be AVAILABLE, UNAVAILABLE, or SUBSTITUTED.`,
        });
      }

      // Enforce customer's substitution policy
      if (
        status === 'SUBSTITUTED' &&
        (item.substitutionPolicy === 'NO_SUBSTITUTIONS' ||
          order.substitutionPolicy === 'NO_SUBSTITUTIONS')
      ) {
        return res.status(400).json({
          success: false,
          code: 'SUBSTITUTION_FORBIDDEN_BY_POLICY',
          message: `Customer selected "No substitutions" for "${item.name}". Mark it UNAVAILABLE instead of substituting.`,
        });
      }

      if (status === 'UNAVAILABLE') {
        item.availabilityStatus = 'UNAVAILABLE';
        item.confirmedQuantity = 0;
        item.actualUnitPriceMinor = 0;
        item.actualLineTotalMinor = 0;
        item.substituteName = '';
        item.substituteBrand = '';
        item.riderNote = String(q.riderNote || 'Out of stock at shop').trim();
      } else {
        const confQty = Math.round(
          Number(q.confirmedQuantity ?? item.requestedQuantity)
        );
        const actPrice = Math.round(Number(q.actualUnitPriceMinor));

        if (!Number.isInteger(confQty) || confQty < 1) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_CONFIRMED_QUANTITY',
            message: `Confirmed quantity for "${item.name}" must be an integer >= 1.`,
          });
        }

        if (!Number.isInteger(actPrice) || actPrice <= 0) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_ACTUAL_PRICE',
            message: `Actual unit price for "${item.name}" must be a positive integer in LKR minor units (cents).`,
          });
        }

        if (status === 'SUBSTITUTED' && !String(q.substituteName || '').trim()) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SUBSTITUTE_NAME',
            message: `Please specify the substitute item name for "${item.name}".`,
          });
        }

        item.availabilityStatus = status;
        item.confirmedQuantity = confQty;
        item.actualUnitPriceMinor = actPrice;
        item.actualLineTotalMinor = actPrice * confQty;
        item.substituteName =
          status === 'SUBSTITUTED' ? String(q.substituteName).trim() : '';
        item.substituteBrand =
          status === 'SUBSTITUTED'
            ? String(q.substituteBrand || '').trim()
            : '';
        item.riderNote = String(q.riderNote || '').trim();
        availableOrSubCount += 1;
      }
    }

    if (availableOrSubCount === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_AVAILABLE_ITEMS_IN_QUOTE',
        message:
          'None of the requested items are available. Use the cancel/exception action ("NO_ITEMS_AVAILABLE") to close this order.',
      });
    }

    const updatedPricing = calculateBackendPricing({
      items: order.items,
      straightLineDistanceMeters: order.shop.straightLineDistanceMeters,
      useConfirmedPrices: true,
    });

    const nextQuoteVersion = (order.quote?.version || 0) + 1;
    const now = new Date();
    const fromStatus = order.status;

    order.pricing.confirmedItemSubtotalMinor =
      updatedPricing.confirmedItemSubtotalMinor;
    order.pricing.approvedMaxAmountMinor = 0;
    order.pricing.finalAmountDueMinor = 0;

    order.quote = {
      version: nextQuoteVersion,
      submittedByRiderId: req.actor.id,
      submittedAt: now,
      expiresAt: new Date(now.getTime() + QUOTE_APPROVAL_TTL_MS),
      quotedItemSubtotalMinor: updatedPricing.confirmedItemSubtotalMinor,
      quotedTotalMinor: updatedPricing.quotedTotalMinor,
      riderSummaryNote: String(riderSummaryNote || '').trim(),
    };

    // Any new or updated quote invalidates previous customer approval
    order.approval = {
      isApproved: false,
      approvedQuoteVersion: null,
      approvedMaxAmountMinor: 0,
      approvedByCustomerId: null,
      approvedAt: null,
      declinedAt: null,
      declineReason: '',
    };

    order.status = 'AWAITING_CUSTOMER_APPROVAL';
    order.history.push({
      fromStatus,
      toStatus: 'AWAITING_CUSTOMER_APPROVAL',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Rider submitted itemized quote v${nextQuoteVersion} (Total: LKR ${(
        updatedPricing.quotedTotalMinor / 100
      ).toFixed(2)}).`,
      metadata: {
        quoteVersion: nextQuoteVersion,
        quotedItemSubtotalMinor: updatedPricing.confirmedItemSubtotalMinor,
        quotedTotalMinor: updatedPricing.quotedTotalMinor,
      },
      timestamp: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Itemized quote v${nextQuoteVersion} submitted and awaiting customer approval.`,
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit rider quote.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/approve-quote
 * Owning customer approves the current quote version, locking in `approvedMaxAmountMinor`.
 */
export const approveRiderQuote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { quoteVersion } = req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    const check = validateOrderTransition(
      order,
      'PURCHASE_APPROVED',
      req.actor
    );
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    if (!order.quote || !order.quote.version) {
      return res.status(409).json({
        success: false,
        code: 'NO_ACTIVE_QUOTE',
        message: 'There is no submitted quote to approve.',
      });
    }

    if (
      quoteVersion !== undefined &&
      Number(quoteVersion) !== order.quote.version
    ) {
      return res.status(409).json({
        success: false,
        code: 'QUOTE_VERSION_MISMATCH',
        message: `Quote version mismatch. Current quote version is v${order.quote.version}, but approval was sent for v${quoteVersion}. Please review the updated quote.`,
      });
    }

    if (
      order.quote.expiresAt &&
      new Date() > new Date(order.quote.expiresAt)
    ) {
      order.exceptionStatus = 'APPROVAL_EXPIRED';
      await order.save();
      return res.status(409).json({
        success: false,
        code: 'QUOTE_APPROVAL_EXPIRED',
        message:
          'This quote has expired. Ask the rider to refresh item availability.',
      });
    }

    const now = new Date();
    const approvedMax = order.quote.quotedTotalMinor;
    const fromStatus = order.status;

    order.approval = {
      isApproved: true,
      approvedQuoteVersion: order.quote.version,
      approvedMaxAmountMinor: approvedMax,
      approvedByCustomerId: req.actor.id,
      approvedAt: now,
      declinedAt: null,
      declineReason: '',
    };

    order.pricing.approvedMaxAmountMinor = approvedMax;
    order.pricing.finalAmountDueMinor = approvedMax;
    order.status = 'PURCHASE_APPROVED';

    order.history.push({
      fromStatus,
      toStatus: 'PURCHASE_APPROVED',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Customer approved quote v${order.quote.version} up to LKR ${(
        approvedMax / 100
      ).toFixed(2)}.`,
      metadata: {
        approvedQuoteVersion: order.quote.version,
        approvedMaxAmountMinor: approvedMax,
      },
      timestamp: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Quote approved! Your rider can now purchase the items.',
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve quote.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/decline-quote
 * Owning customer declines the quote (either requesting revision in SHOPPING or cancelling).
 */
export const declineRiderQuote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action = 'REVISE', reason = 'Customer declined quote.' } =
      req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    const targetStatus = action === 'CANCEL' ? 'CANCELLED' : 'SHOPPING';

    const check = validateOrderTransition(order, targetStatus, req.actor);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    const now = new Date();
    const fromStatus = order.status;

    order.approval.isApproved = false;
    order.approval.approvedQuoteVersion = null;
    order.approval.declinedAt = now;
    order.approval.declineReason = String(reason).trim();

    order.status = targetStatus;
    if (targetStatus === 'CANCELLED') {
      order.cancellationReason = String(reason).trim();
      order.cancelledByRole = req.actor.role;

      if (order.assignedRiderId) {
        await Rider.updateOne(
          { id: order.assignedRiderId, activeOrderId: order.orderId },
          { $set: { activeOrderId: null, isAvailable: true } }
        );
      }
    }

    order.history.push({
      fromStatus,
      toStatus: targetStatus,
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Customer declined quote (${action}): ${reason}`,
      timestamp: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to decline quote.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/receipt
 * Assigned rider uploads a receipt photo (validated by size and magic bytes).
 */
export const uploadOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiptData, mimeType = '', merchantReceiptRef = '' } =
      req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found.',
      });
    }

    if (
      req.actor.role === 'rider' &&
      order.assignedRiderId !== req.actor.id
    ) {
      return res.status(403).json({
        success: false,
        code: 'NOT_ASSIGNED_RIDER',
        message: 'Only the assigned rider can upload a receipt for this order.',
      });
    }

    if (
      !['PURCHASE_APPROVED', 'PURCHASED', 'OUT_FOR_DELIVERY'].includes(
        order.status
      )
    ) {
      return res.status(409).json({
        success: false,
        code: 'RECEIPT_UPLOAD_NOT_ALLOWED_IN_STATE',
        message: `Receipt can only be uploaded once quote is approved (current status: ${order.status}).`,
      });
    }

    const savedReceipt = await saveValidatedReceipt({
      payload: receiptData,
      declaredMimeType: mimeType,
      orderId: order.orderId,
    });

    order.receipt = {
      uploaded: true,
      storageKey: savedReceipt.storageKey,
      safeFilename: savedReceipt.safeFilename,
      mimeType: savedReceipt.mimeType,
      sizeBytes: savedReceipt.sizeBytes,
      uploadedByRiderId: req.actor.id,
      uploadedAt: savedReceipt.uploadedAt,
      merchantReceiptRef: String(merchantReceiptRef || '').trim(),
    };

    order.history.push({
      fromStatus: order.status,
      toStatus: order.status,
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Rider uploaded verified shop receipt (${savedReceipt.mimeType}, ${savedReceipt.sizeBytes} bytes).`,
      metadata: {
        safeFilename: savedReceipt.safeFilename,
        merchantReceiptRef: order.receipt.merchantReceiptRef,
      },
      timestamp: new Date(),
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Receipt validated and stored.',
      data: order.toObject(),
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      code: error.code || 'RECEIPT_UPLOAD_FAILED',
      message: error.message || 'Failed to upload receipt.',
    });
  }
};

/**
 * GET /api/concierge/orders/:orderId/receipt
 * Streams the receipt image ONLY to the order owner, assigned rider, or admin.
 */
export const viewOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actor = req.actor;

    if (!actor) {
      return res.status(401).json({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to view receipt.',
      });
    }

    const order = await ConciergeOrder.findOne({ orderId }).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found.',
      });
    }

    const isAuthorized =
      actor.role === 'admin' ||
      (actor.role === 'customer' && order.customerId === actor.id) ||
      (actor.role === 'rider' && order.assignedRiderId === actor.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_RECEIPT_ACCESS',
        message:
          'Access denied. Only the order owner, assigned rider, or administrator can view this receipt.',
      });
    }

    if (!order.receipt?.uploaded || !order.receipt?.storageKey) {
      return res.status(404).json({
        success: false,
        code: 'RECEIPT_NOT_UPLOADED',
        message: 'No receipt has been uploaded for this order yet.',
      });
    }

    const buffer = await readReceiptFromStorage(order.receipt.storageKey);
    res.setHeader('Content-Type', order.receipt.mimeType || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: 'Failed to read receipt image.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/purchase
 * Rider confirms items have been purchased at the shop.
 * Strictly requires:
 * 1. Current quote version is approved by the customer.
 * 2. Final total does NOT exceed `approvedMaxAmountMinor`.
 * 3. A valid receipt is uploaded (either previously or inline in request body).
 */
export const markOrderPurchased = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      actualItemSubtotalMinor,
      receiptData,
      mimeType,
      merchantReceiptRef,
    } = req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    const check = validateOrderTransition(order, 'PURCHASED', req.actor);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    // Verify customer approval matches current quote version
    if (
      !order.approval?.isApproved ||
      order.approval.approvedQuoteVersion !== order.quote?.version
    ) {
      return res.status(409).json({
        success: false,
        code: 'QUOTE_NOT_APPROVED',
        message:
          'Cannot purchase items before the customer approves the current quote version.',
      });
    }

    const itemSubtotalToCharge =
      actualItemSubtotalMinor !== undefined
        ? Math.round(Number(actualItemSubtotalMinor))
        : order.pricing.confirmedItemSubtotalMinor;

    if (
      !Number.isInteger(itemSubtotalToCharge) ||
      itemSubtotalToCharge <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PURCHASE_AMOUNT',
        message: 'Purchased item subtotal must be a positive integer in minor units.',
      });
    }

    const totalToCharge =
      itemSubtotalToCharge +
      order.pricing.deliveryFeeMinor +
      order.pricing.serviceFeeMinor;

    // Rider cannot purchase beyond the customer's approved maximum amount
    if (totalToCharge > order.approval.approvedMaxAmountMinor) {
      return res.status(409).json({
        success: false,
        code: 'PURCHASE_EXCEEDS_APPROVED_AMOUNT',
        message: `Total purchase amount (${totalToCharge} minor units) exceeds customer-approved maximum (${order.approval.approvedMaxAmountMinor} minor units). Submit a revised quote for approval first.`,
      });
    }

    // Handle inline receipt upload if provided
    if (receiptData) {
      const savedReceipt = await saveValidatedReceipt({
        payload: receiptData,
        declaredMimeType: mimeType,
        orderId: order.orderId,
      });
      order.receipt = {
        uploaded: true,
        storageKey: savedReceipt.storageKey,
        safeFilename: savedReceipt.safeFilename,
        mimeType: savedReceipt.mimeType,
        sizeBytes: savedReceipt.sizeBytes,
        uploadedByRiderId: req.actor.id,
        uploadedAt: savedReceipt.uploadedAt,
        merchantReceiptRef: String(merchantReceiptRef || '').trim(),
      };
    }

    if (!order.receipt?.uploaded) {
      return res.status(400).json({
        success: false,
        code: 'RECEIPT_REQUIRED_FOR_PURCHASE',
        message:
          'Please upload the shop receipt image before or when marking the order as purchased.',
      });
    }

    const fromStatus = order.status;
    order.status = 'PURCHASED';
    order.pricing.confirmedItemSubtotalMinor = itemSubtotalToCharge;
    order.pricing.finalAmountDueMinor = totalToCharge;

    order.financials.riderFundedPurchaseMinor = itemSubtotalToCharge;
    order.financials.settlementStatus = 'PENDING_COD_COLLECTION';

    order.history.push({
      fromStatus,
      toStatus: 'PURCHASED',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Rider purchased approved items at shop (Items: LKR ${(
        itemSubtotalToCharge / 100
      ).toFixed(2)}, Total due: LKR ${(totalToCharge / 100).toFixed(2)}).`,
      metadata: {
        riderFundedPurchaseMinor: itemSubtotalToCharge,
        finalAmountDueMinor: totalToCharge,
      },
      timestamp: new Date(),
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Purchase recorded with receipt.',
      data: order.toObject(),
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      code: error.code || 'PURCHASE_FAILED',
      message: error.message || 'Failed to record purchase.',
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/out-for-delivery
 * Rider starts heading from the shop to the customer's delivery address.
 */
export const markOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await ConciergeOrder.findOne({ orderId });

    const check = validateOrderTransition(
      order,
      'OUT_FOR_DELIVERY',
      req.actor
    );
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    const fromStatus = order.status;
    order.status = 'OUT_FOR_DELIVERY';
    order.history.push({
      fromStatus,
      toStatus: 'OUT_FOR_DELIVERY',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: 'Rider is out for delivery to customer address.',
      timestamp: new Date(),
    });

    await order.save();

    return res.status(200).json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark order out for delivery.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/deliver
 * Rider completes delivery, collects Cash on Delivery (COD), releases active assignment,
 * and triggers idempotent append-only ledger settlement.
 */
export const completeDeliveryAndSettle = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await ConciergeOrder.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found.',
      });
    }

    // Idempotent handling: if already DELIVERED by this assigned rider or admin, return settled state without duplicating ledger
    if (order.status === 'DELIVERED') {
      if (
        req.actor.role === 'rider' &&
        order.assignedRiderId !== req.actor.id
      ) {
        return res.status(403).json({
          success: false,
          code: 'NOT_ASSIGNED_RIDER',
          message: 'Only the assigned rider can settle this order.',
        });
      }

      const settlement = await settleDeliveredConciergeOrder(order);
      return res.status(200).json({
        success: true,
        idempotentReplay: true,
        message: 'Order already delivered and settled (idempotent response).',
        data: {
          ...order.toObject(),
          financials: settlement.financials,
          ledgerEntries: settlement.ledgerEntries,
        },
      });
    }

    const check = validateOrderTransition(order, 'DELIVERED', req.actor);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    const fromStatus = order.status;
    const settlement = await settleDeliveredConciergeOrder(order);

    order.status = 'DELIVERED';
    order.financials = settlement.financials;
    order.history.push({
      fromStatus,
      toStatus: 'DELIVERED',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Order delivered and Cash on Delivery (LKR ${(
        settlement.financials.customerCashCollectedMinor / 100
      ).toFixed(2)}) settled.`,
      metadata: settlement.financials,
      timestamp: new Date(),
    });

    await order.save();

    // Ensure rider's activeOrderId is cleared even if settlement was replayed
    if (order.assignedRiderId) {
      await Rider.updateOne(
        { id: order.assignedRiderId, activeOrderId: order.orderId },
        { $set: { activeOrderId: null, isAvailable: true } }
      );
    }

    return res.status(200).json({
      success: true,
      idempotentReplay: settlement.idempotentReplay,
      message: 'Delivery confirmed and financial ledger settled.',
      data: {
        ...order.toObject(),
        ledgerEntries: settlement.ledgerEntries,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to complete delivery and settlement.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/cancel
 * Cancels an order BEFORE purchase.
 * If the order is already PURCHASED, rejects direct cancellation and directs to the exception flow.
 */
export const cancelConciergeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      reason = 'Cancelled by user.',
      exceptionType = 'NONE', // e.g. 'SHOP_CLOSED' | 'NO_ITEMS_AVAILABLE'
    } = req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    const check = validateOrderTransition(order, 'CANCELLED', req.actor);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        code: check.code,
        message: check.message,
      });
    }

    const fromStatus = order.status;
    order.status = 'CANCELLED';
    order.cancellationReason = String(reason).trim();
    order.cancelledByRole = req.actor.role;

    if (['SHOP_CLOSED', 'NO_ITEMS_AVAILABLE'].includes(exceptionType)) {
      order.exceptionStatus = exceptionType;
    }

    order.history.push({
      fromStatus,
      toStatus: 'CANCELLED',
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Order cancelled (${exceptionType}): ${reason}`,
      timestamp: new Date(),
    });

    await order.save();

    if (order.assignedRiderId) {
      await Rider.updateOne(
        { id: order.assignedRiderId, activeOrderId: order.orderId },
        { $set: { activeOrderId: null, isAvailable: true } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled and any assigned rider has been released.',
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order.',
      error: error.message,
    });
  }
};

/**
 * POST /api/concierge/orders/:orderId/support-exception
 * Routes post-purchase cancellation requests or delivery disputes to an explicit
 * support/exception workflow so rider out-of-pocket funds are protected.
 */
export const reportOrderException = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = 'Post-purchase cancellation or support request' } =
      req.body || {};

    const order = await ConciergeOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found.',
      });
    }

    const isAuthorized =
      req.actor.role === 'admin' ||
      (req.actor.role === 'customer' && order.customerId === req.actor.id) ||
      (req.actor.role === 'rider' && order.assignedRiderId === req.actor.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Not authorized to file an exception for this order.',
      });
    }

    order.exceptionStatus = POST_PURCHASE_STATES.includes(order.status)
      ? 'CANCELLATION_REQUESTED_AFTER_PURCHASE'
      : 'DISPUTED';
    order.exceptionNotes = String(reason).trim();
    order.financials.settlementStatus = 'EXCEPTION_REVIEW';

    order.history.push({
      fromStatus: order.status,
      toStatus: order.status,
      actorRole: req.actor.role,
      actorId: req.actor.id,
      actorName: req.actor.name,
      reason: `Support exception filed (${order.exceptionStatus}): ${reason}`,
      metadata: {
        riderFundedPurchaseMinor: order.financials.riderFundedPurchaseMinor,
      },
      timestamp: new Date(),
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        'Exception recorded for support review. Because items were already purchased, rider reimbursement protection remains active.',
      data: order.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record support exception.',
      error: error.message,
    });
  }
};
