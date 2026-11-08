import mongoose from 'mongoose';

const settlementLedgerSchema = new mongoose.Schema(
  {
    entryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    riderId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: [
        'RIDER_PURCHASE_OUTLAY',
        'CUSTOMER_COD_COLLECTED',
        'RIDER_REIMBURSEMENT_CREDIT',
        'RIDER_DELIVERY_EARNINGS',
        'PLATFORM_SERVICE_FEE',
      ],
      required: true,
    },
    amountMinor: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Ledger amountMinor must be an integer in LKR minor units (cents).',
      },
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    isDemoLedgerCredit: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    // Append-only ledger: disable updates after creation
    timestamps: false,
  }
);

// Unique compound index ensures idempotent settlement: at most one entry of each type per order
settlementLedgerSchema.index({ orderId: 1, entryType: 1 }, { unique: true });

const SettlementLedger =
  mongoose.models.SettlementLedger ||
  mongoose.model('SettlementLedger', settlementLedgerSchema);

export default SettlementLedger;
