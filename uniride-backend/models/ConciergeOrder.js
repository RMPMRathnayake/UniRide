import mongoose from 'mongoose';

const conciergeItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    isCustomRequest: { type: Boolean, default: false },
    templateId: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    unitLabel: { type: String, default: '1 unit' },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'requestedQuantity must be an integer >= 1.',
      },
    },
    preferredBrand: { type: String, default: '' },
    customerNotes: { type: String, default: '' },
    referenceImageUrl: { type: String, default: '' },
    substitutionPolicy: {
      type: String,
      enum: ['NO_SUBSTITUTIONS', 'ASK_FIRST', 'ALLOW_WITHIN_BUDGET'],
      default: 'ASK_FIRST',
    },
    // Snapshot of displayed estimated unit price in LKR minor units (cents)
    estimatedUnitPriceMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'estimatedUnitPriceMinor must be an integer in LKR minor units.',
      },
    },
    estimatedLineTotalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    isVerifiedInventory: { type: Boolean, default: false },
    priceLabel: { type: String, default: 'Estimated price' },
    availabilityLabel: { type: String, default: 'Availability confirmed by rider' },

    // Rider quote confirmation fields
    availabilityStatus: {
      type: String,
      enum: ['PENDING', 'AVAILABLE', 'UNAVAILABLE', 'SUBSTITUTED'],
      default: 'PENDING',
    },
    confirmedQuantity: { type: Number, default: 0, min: 0 },
    actualUnitPriceMinor: { type: Number, default: null, min: 0 },
    actualLineTotalMinor: { type: Number, default: 0, min: 0 },
    substituteName: { type: String, default: '' },
    substituteBrand: { type: String, default: '' },
    riderNote: { type: String, default: '' },
  },
  { _id: false }
);

const historyTransitionSchema = new mongoose.Schema(
  {
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    actorRole: {
      type: String,
      enum: ['customer', 'rider', 'admin', 'system'],
      required: true,
    },
    actorId: { type: String, required: true },
    actorName: { type: String, default: '' },
    reason: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const CONCIERGE_ORDER_STATUSES = [
  'REQUESTED',
  'ASSIGNED',
  'SHOPPING',
  'AWAITING_CUSTOMER_APPROVAL',
  'PURCHASE_APPROVED',
  'PURCHASED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const conciergeOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
    // Private delivery address (revealed ONLY to owner, assigned rider, and admin)
    deliveryAddress: {
      type: String,
      required: true,
    },
    // General area description safe to show to unassigned riders browsing jobs
    deliveryAreaPublic: {
      type: String,
      required: true,
      default: 'South Eastern University / Oluvil Area',
    },
    deliveryCoordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    deliveryInstructions: {
      type: String,
      default: '',
    },
    shop: {
      externalId: { type: String, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
      storeType: {
        type: String,
        enum: ['independent_osm', 'partner', 'demonstration'],
        default: 'independent_osm',
      },
      isIndependent: { type: Boolean, default: true },
      conciergeNotice: {
        type: String,
        default:
          'An independent rider shops here on your behalf. Prices and availability are confirmed before purchase.',
      },
      address: { type: String, default: '' },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      straightLineDistanceMeters: { type: Number, default: 0 },
      estimatedRoadDistanceKm: { type: Number, default: 0 },
    },
    substitutionPolicy: {
      type: String,
      enum: ['NO_SUBSTITUTIONS', 'ASK_FIRST', 'ALLOW_WITHIN_BUDGET'],
      default: 'ASK_FIRST',
    },
    substitutionMaxBudgetMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: {
      type: [conciergeItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must contain at least one requested item.',
      },
    },
    pricing: {
      currency: { type: String, default: 'LKR' },
      estimatedItemSubtotalMinor: { type: Number, required: true, min: 0 },
      confirmedItemSubtotalMinor: { type: Number, default: 0, min: 0 },
      deliveryFeeMinor: { type: Number, required: true, min: 0 },
      serviceFeeMinor: { type: Number, required: true, min: 0 },
      estimatedTotalMinor: { type: Number, required: true, min: 0 },
      approvedMaxAmountMinor: { type: Number, default: 0, min: 0 },
      finalAmountDueMinor: { type: Number, default: 0, min: 0 },
    },
    quote: {
      version: { type: Number, default: 0 },
      submittedByRiderId: { type: String, default: null },
      submittedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      quotedItemSubtotalMinor: { type: Number, default: 0 },
      quotedTotalMinor: { type: Number, default: 0 },
      riderSummaryNote: { type: String, default: '' },
    },
    approval: {
      isApproved: { type: Boolean, default: false },
      approvedQuoteVersion: { type: Number, default: null },
      approvedMaxAmountMinor: { type: Number, default: 0 },
      approvedByCustomerId: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      declinedAt: { type: Date, default: null },
      declineReason: { type: String, default: '' },
    },
    assignedRiderId: {
      type: String,
      default: null,
      index: true,
    },
    assignedRiderName: {
      type: String,
      default: null,
    },
    assignedRiderPhone: {
      type: String,
      default: null,
    },
    assignedRiderVehicle: {
      type: String,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: CONCIERGE_ORDER_STATUSES,
      default: 'REQUESTED',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledByRole: {
      type: String,
      default: null,
    },
    exceptionStatus: {
      type: String,
      enum: [
        'NONE',
        'CANCELLATION_REQUESTED_AFTER_PURCHASE',
        'SHOP_CLOSED',
        'NO_ITEMS_AVAILABLE',
        'APPROVAL_EXPIRED',
        'DISPUTED',
      ],
      default: 'NONE',
    },
    exceptionNotes: {
      type: String,
      default: '',
    },
    receipt: {
      uploaded: { type: Boolean, default: false },
      storageKey: { type: String, default: null },
      safeFilename: { type: String, default: null },
      mimeType: { type: String, default: null },
      sizeBytes: { type: Number, default: 0 },
      uploadedByRiderId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
      merchantReceiptRef: { type: String, default: '' },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'SIMULATED_CARD_PROTOTYPE'],
      default: 'COD',
    },
    financials: {
      purchaseFundingSource: {
        type: String,
        enum: ['RIDER_CASH_ADVANCE', 'DEMO_SIMULATION'],
        default: 'RIDER_CASH_ADVANCE',
      },
      riderFundedPurchaseMinor: { type: Number, default: 0 },
      customerCashCollectedMinor: { type: Number, default: 0 },
      riderReimbursementMinor: { type: Number, default: 0 },
      riderDeliveryEarningsMinor: { type: Number, default: 0 },
      platformFeeMinor: { type: Number, default: 0 },
      settlementStatus: {
        type: String,
        enum: ['UNSETTLED', 'PENDING_COD_COLLECTION', 'SETTLED', 'EXCEPTION_REVIEW'],
        default: 'UNSETTLED',
      },
      settledAt: { type: Date, default: null },
    },
    history: {
      type: [historyTransitionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate orders when customer double-clicks checkout or retries
conciergeOrderSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true });

const ConciergeOrder =
  mongoose.models.ConciergeOrder ||
  mongoose.model('ConciergeOrder', conciergeOrderSchema);

export default ConciergeOrder;
