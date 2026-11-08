/**
 * Explicit State Machine for Concierge Shopping & Rider Delivery Orders.
 *
 * Enforces:
 * - Valid state transitions
 * - Role and ownership permissions (owning customer vs assigned rider vs admin)
 * - Post-purchase financial protection (cannot simply cancel once PURCHASED)
 * - Quote approval verification before PURCHASED
 */

export const ALLOWED_TRANSITIONS = {
  REQUESTED: {
    ASSIGNED: ['rider', 'admin'],
    CANCELLED: ['customer', 'admin', 'system'],
  },
  ASSIGNED: {
    SHOPPING: ['rider', 'admin'],
    CANCELLED: ['customer', 'rider', 'admin'],
  },
  SHOPPING: {
    AWAITING_CUSTOMER_APPROVAL: ['rider', 'admin'],
    CANCELLED: ['customer', 'rider', 'admin'],
  },
  AWAITING_CUSTOMER_APPROVAL: {
    PURCHASE_APPROVED: ['customer', 'admin'],
    AWAITING_CUSTOMER_APPROVAL: ['rider', 'admin'], // Rider revising quote
    SHOPPING: ['customer', 'rider', 'admin'], // Customer requests revision
    CANCELLED: ['customer', 'rider', 'admin', 'system'],
  },
  PURCHASE_APPROVED: {
    PURCHASED: ['rider', 'admin'],
    AWAITING_CUSTOMER_APPROVAL: ['rider', 'admin'], // Revised quote invalidates approval
    CANCELLED: ['customer', 'rider', 'admin'], // Allowed only BEFORE purchase
  },
  PURCHASED: {
    OUT_FOR_DELIVERY: ['rider', 'admin'],
    // Note: CANCELLED is intentionally excluded once PURCHASED.
  },
  OUT_FOR_DELIVERY: {
    DELIVERED: ['rider', 'admin'],
    // Note: CANCELLED is intentionally excluded once OUT_FOR_DELIVERY.
  },
  DELIVERED: {},
  CANCELLED: {},
};

export const POST_PURCHASE_STATES = [
  'PURCHASED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

/**
 * Validates whether an order can transition from `order.status` to `targetStatus`
 * by `actor` (`{ role, id, name }`).
 *
 * @returns {{ valid: boolean, status?: number, code?: string, message?: string }}
 */
export function validateOrderTransition(order, targetStatus, actor) {
  if (!order) {
    return {
      valid: false,
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order not found.',
    };
  }

  if (!actor || !actor.role || !actor.id) {
    return {
      valid: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Actor identity is required.',
    };
  }

  const currentStatus = order.status;

  // Special protection: Once items are PURCHASED at the shop, simple cancellation is blocked
  if (
    targetStatus === 'CANCELLED' &&
    POST_PURCHASE_STATES.includes(currentStatus)
  ) {
    return {
      valid: false,
      status: 409,
      code: 'POST_PURCHASE_CANCELLATION_FORBIDDEN',
      message:
        'Order has already been purchased by the rider. Direct cancellation is blocked to protect rider funds; please submit a support/exception request instead.',
    };
  }

  const stateRules = ALLOWED_TRANSITIONS[currentStatus];
  if (!stateRules || !stateRules[targetStatus]) {
    return {
      valid: false,
      status: 409,
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition order from ${currentStatus} to ${targetStatus}.`,
    };
  }

  const allowedRoles = stateRules[targetStatus];
  if (!allowedRoles.includes(actor.role)) {
    return {
      valid: false,
      status: 403,
      code: 'FORBIDDEN_ROLE',
      message: `Actor with role "${actor.role}" is not permitted to transition order from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // Ownership checks
  if (actor.role === 'customer' && order.customerId !== actor.id) {
    return {
      valid: false,
      status: 403,
      code: 'NOT_ORDER_OWNER',
      message: 'Only the owning customer can perform this action on the order.',
    };
  }

  if (
    actor.role === 'rider' &&
    currentStatus !== 'REQUESTED' &&
    order.assignedRiderId !== actor.id
  ) {
    return {
      valid: false,
      status: 403,
      code: 'NOT_ASSIGNED_RIDER',
      message: 'Only the assigned rider for this order can perform this action.',
    };
  }

  return { valid: true };
}

/**
 * Pricing calculator in integer minor units (LKR cents, e.g. LKR 100.00 = 10000).
 * Never trusts browser-supplied totals.
 */
export function calculateBackendPricing({
  items = [],
  straightLineDistanceMeters = 1000,
  useConfirmedPrices = false,
}) {
  let estimatedItemSubtotalMinor = 0;
  let confirmedItemSubtotalMinor = 0;

  for (const item of items) {
    const reqQty = Math.max(1, Math.round(Number(item.requestedQuantity || 1)));
    const estUnit = Math.max(
      0,
      Math.round(Number(item.estimatedUnitPriceMinor || 0))
    );
    estimatedItemSubtotalMinor += estUnit * reqQty;

    if (
      useConfirmedPrices &&
      (item.availabilityStatus === 'AVAILABLE' ||
        item.availabilityStatus === 'SUBSTITUTED')
    ) {
      const confQty = Math.max(
        0,
        Math.round(Number(item.confirmedQuantity ?? reqQty))
      );
      const actUnit = Math.max(
        0,
        Math.round(Number(item.actualUnitPriceMinor ?? 0))
      );
      confirmedItemSubtotalMinor += actUnit * confQty;
    }
  }

  // Base delivery fee: LKR 100.00 (10000 minor units) for up to 1.5 km straight-line,
  // plus LKR 35.00 (3500 minor units) per additional km.
  const distKm = Math.max(0, Number(straightLineDistanceMeters || 0) / 1000);
  const extraKm = Math.max(0, Math.ceil(distKm - 1.5));
  const deliveryFeeMinor = 10000 + extraKm * 3500;

  // Concierge service fee: 5% of estimated subtotal, clamped between LKR 30.00 (3000) and LKR 150.00 (15000)
  const rawServiceFee = Math.round(estimatedItemSubtotalMinor * 0.05);
  const serviceFeeMinor = Math.min(15000, Math.max(3000, rawServiceFee));

  const estimatedTotalMinor =
    estimatedItemSubtotalMinor + deliveryFeeMinor + serviceFeeMinor;
  const quotedTotalMinor =
    confirmedItemSubtotalMinor + deliveryFeeMinor + serviceFeeMinor;

  return {
    estimatedItemSubtotalMinor,
    confirmedItemSubtotalMinor,
    deliveryFeeMinor,
    serviceFeeMinor,
    estimatedTotalMinor,
    quotedTotalMinor,
  };
}
