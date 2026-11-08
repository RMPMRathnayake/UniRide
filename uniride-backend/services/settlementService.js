import SettlementLedger from '../models/SettlementLedger.js';
import Rider from '../models/Rider.js';

/**
 * Records idempotent, append-only financial settlement ledger entries for a delivered
 * concierge order and updates the rider's demonstration ledger credit exactly once.
 *
 * Repeated calls for the same orderId are guaranteed idempotent via the unique
 * compound index `{ orderId: 1, entryType: 1 }` and `$setOnInsert`.
 */
export async function settleDeliveredConciergeOrder(order) {
  const orderId = order.orderId;
  const riderId = order.assignedRiderId;
  const customerId = order.customerId;

  const riderFundedPurchaseMinor = Math.round(
    Number(order.pricing?.confirmedItemSubtotalMinor || 0)
  );
  const riderDeliveryEarningsMinor = Math.round(
    Number(order.pricing?.deliveryFeeMinor || 0)
  );
  const platformFeeMinor = Math.round(
    Number(order.pricing?.serviceFeeMinor || 0)
  );
  const customerCashCollectedMinor =
    riderFundedPurchaseMinor + riderDeliveryEarningsMinor + platformFeeMinor;
  const riderReimbursementMinor = riderFundedPurchaseMinor;

  const now = new Date();

  const plannedEntries = [
    {
      entryId: `LEDG-${orderId}-OUTLAY`,
      orderId,
      riderId,
      customerId,
      entryType: 'RIDER_PURCHASE_OUTLAY',
      amountMinor: riderFundedPurchaseMinor,
      currency: 'LKR',
      isDemoLedgerCredit: false,
      description:
        'Rider out-of-pocket cash paid at physical shop counter (reimbursed via COD).',
      createdAt: now,
    },
    {
      entryId: `LEDG-${orderId}-COD`,
      orderId,
      riderId,
      customerId,
      entryType: 'CUSTOMER_COD_COLLECTED',
      amountMinor: customerCashCollectedMinor,
      currency: 'LKR',
      isDemoLedgerCredit: false,
      description: 'Cash on Delivery (COD) collected from customer upon handoff.',
      createdAt: now,
    },
    {
      entryId: `LEDG-${orderId}-REIMB`,
      orderId,
      riderId,
      customerId,
      entryType: 'RIDER_REIMBURSEMENT_CREDIT',
      amountMinor: riderReimbursementMinor,
      currency: 'LKR',
      isDemoLedgerCredit: true,
      description:
        'Rider purchase reimbursement recorded from COD collection.',
      createdAt: now,
    },
    {
      entryId: `LEDG-${orderId}-EARN`,
      orderId,
      riderId,
      customerId,
      entryType: 'RIDER_DELIVERY_EARNINGS',
      amountMinor: riderDeliveryEarningsMinor,
      currency: 'LKR',
      isDemoLedgerCredit: true,
      description:
        'Rider delivery fee earnings credited to demonstration ledger (not physical shop cash).',
      createdAt: now,
    },
    {
      entryId: `LEDG-${orderId}-PLAT`,
      orderId,
      riderId,
      customerId,
      entryType: 'PLATFORM_SERVICE_FEE',
      amountMinor: platformFeeMinor,
      currency: 'LKR',
      isDemoLedgerCredit: true,
      description: 'UniEats platform concierge service fee.',
      createdAt: now,
    },
  ];

  // Upsert each ledger entry with $setOnInsert so existing entries are never modified or duplicated
  const bulkOps = plannedEntries.map((entry) => ({
    updateOne: {
      filter: { orderId: entry.orderId, entryType: entry.entryType },
      update: { $setOnInsert: entry },
      upsert: true,
    },
  }));

  const bulkResult = await SettlementLedger.bulkWrite(bulkOps, {
    ordered: true,
  });

  const newlySettled = bulkResult.upsertedCount > 0;

  // Credit rider's demonstration ledger balance and increment completedDeliveries ONLY once
  if (newlySettled && riderId) {
    await Rider.updateOne(
      { id: riderId },
      {
        $inc: {
          demoLedgerBalanceMinor: riderDeliveryEarningsMinor,
          completedDeliveries: 1,
        },
        $set: {
          activeOrderId: null,
          isAvailable: true,
        },
      }
    );
  }

  const ledgerEntries = await SettlementLedger.find({ orderId })
    .sort({ entryId: 1 })
    .lean();

  const financials = {
    purchaseFundingSource:
      order.paymentMethod === 'COD' ? 'RIDER_CASH_ADVANCE' : 'DEMO_SIMULATION',
    riderFundedPurchaseMinor,
    customerCashCollectedMinor,
    riderReimbursementMinor,
    riderDeliveryEarningsMinor,
    platformFeeMinor,
    settlementStatus: 'SETTLED',
    settledAt: order.financials?.settledAt || now,
  };

  return {
    financials,
    ledgerEntries,
    idempotentReplay: !newlySettled,
  };
}
