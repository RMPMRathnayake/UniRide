import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Bike,
  Store,
  Phone,
  Receipt,
  ShieldCheck,
  X,
  Check,
  Loader2,
  MapPin,
  ArrowLeft,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

const STEPS = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ASSIGNED', label: 'Rider Assigned' },
  { key: 'SHOPPING', label: 'Shopping' },
  { key: 'AWAITING_CUSTOMER_APPROVAL', label: 'Quote Review' },
  { key: 'PURCHASED', label: 'Purchased' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function ConciergeOrderTracker({
  orderId,
  actor,
  onBack,
  onOpenReceipt,
}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const headers = {};
      if (actor?.id) {
        headers['X-Demo-Actor-Id'] = actor.id;
      }
      const res = await fetch(`/api/concierge/orders/${orderId}`, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrder(json.data || json.order);
      } else {
        setError(json.message || 'Failed to load order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Live polling every 3 seconds so the user sees rider progress without reloading!
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId, actor?.id]);

  const handleApproveQuote = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (actor?.id) headers['X-Demo-Actor-Id'] = actor.id;

      const res = await fetch(`/api/concierge/orders/${orderId}/approve-quote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          approvedQuoteVersion: order.quote?.quoteVersion || 1,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not approve quote');
      }
      setOrder(json.data || json.order);
      setActionMessage('Quote approved! Rider authorized to make physical purchase.');
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineQuote = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (actor?.id) headers['X-Demo-Actor-Id'] = actor.id;

      const res = await fetch(`/api/concierge/orders/${orderId}/decline-quote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason: 'Customer requested price/item revision',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not decline quote');
      }
      setOrder(json.data || json.order);
      setActionMessage('Quote returned to rider for revision.');
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this concierge shopping request?')) {
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (actor?.id) headers['X-Demo-Actor-Id'] = actor.id;

      const res = await fetch(`/api/concierge/orders/${orderId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason: 'Customer cancelled prior to physical purchase',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not cancel order');
      }
      setOrder(json.data || json.order);
      setActionMessage('Order has been cancelled.');
    } catch (err) {
      setActionMessage(`Cancellation rejected: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
        <Loader2 size={32} className="ue-spin" style={{ margin: '0 auto 12px' }} />
        <div>Connecting to Concierge Live Dispatch...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b' }}>
        <h3>Could not load concierge order</h3>
        <p>{error || 'Order not found'}</p>
        <button
          type="button"
          onClick={onBack}
          style={{ background: '#991b1b', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const currentStatusIndex = STEPS.findIndex((s) => s.key === order.status);
  const isAwaitingApproval = order.status === 'AWAITING_CUSTOMER_APPROVAL';
  const isPurchasedOrLater = ['PURCHASED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div style={{ maxWidth: '850px', margin: '20px auto', padding: '16px' }}>
      {/* Top Bar */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          fontSize: '14px',
          fontWeight: 700,
          color: '#0D253F',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={16} color="#0D253F" />
        Back to Storefront
      </button>

      {/* Main Order Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(13, 37, 63, 0.05)',
          marginBottom: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, background: '#EDF2F7', padding: '3px 8px', borderRadius: '6px', color: '#0D253F' }}>
                {order.orderId}
              </span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0D253F', margin: 0 }}>
              Shopping at {order.shop?.name || order.shopDetails?.name}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#B45309', fontWeight: 800 }}>
              Payment Mode
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0D253F' }}>
              Cash on Delivery (COD)
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        {!isCancelled ? (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 10px' }}>
              {STEPS.map((step, idx) => {
                const isCompleted = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;

                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      flex: 1,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isCurrent ? '#0D253F' : isCompleted ? '#F59E0B' : '#E2E8F0',
                        color: isCompleted || isCurrent ? '#ffffff' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(13, 37, 63, 0.15)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isCompleted && !isCurrent ? <Check size={14} /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? '#0D253F' : isCompleted ? '#B45309' : '#94A3B8',
                        marginTop: '6px',
                        lineHeight: 1.2,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              padding: '14px',
              color: '#991b1b',
              marginBottom: '20px',
              fontSize: '13px',
            }}
          >
            <strong>Order Cancelled:</strong> {order.cancellationReason || 'This order was cancelled prior to physical purchase.'}
          </div>
        )}

        {/* Assigned Rider Info (if assigned) */}
        {Boolean(order.assignedRiderId || order.riderId) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0D253F',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                🛵
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0D253F' }}>
                  {order.assignedRiderSnapshot?.name || order.riderSnapshot?.name || 'Kasun Perera'} (Peer Student Rider)
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {order.assignedRiderSnapshot?.vehicle || order.riderSnapshot?.vehicle || 'Honda Dio 110'} •{' '}
                  {order.assignedRiderSnapshot?.phone || order.riderSnapshot?.phone || '+94 77 812 3401'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`tel:${order.assignedRiderSnapshot?.phone || order.riderSnapshot?.phone || ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <Phone size={13} /> Call Rider
              </a>
            </div>
          </div>
        )}

        {/* PRIORITY ACTION CARD: CUSTOMER QUOTE APPROVAL */}
        {isAwaitingApproval && order.quote && (
          <div
            style={{
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#92400E' }}>
              <AlertCircle size={20} color="#F59E0B" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#92400E' }}>
                Quote Approval Required (Version {order.quote.quoteVersion})
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 16px', lineHeight: 1.5 }}>
              Your student rider has checked shelf availability at <strong>{order.shopDetails?.name}</strong> and prepared your confirmed quote. Please review each item below:
            </p>

            {/* Itemized Quote Table */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #FDE68A', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A', textAlign: 'left', color: '#92400E' }}>
                    <th style={{ padding: '8px 12px' }}>Item</th>
                    <th style={{ padding: '8px 12px' }}>Qty</th>
                    <th style={{ padding: '8px 12px' }}>Availability</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actual Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.quote.items?.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                        {it.name}
                        {it.substitutedWithName && (
                          <div style={{ fontSize: '11px', color: '#d97706' }}>
                            Substituted: {it.substitutedWithName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{it.quantity}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background:
                              it.availabilityStatus === 'AVAILABLE'
                                ? '#dcfce7'
                                : it.availabilityStatus === 'SUBSTITUTED'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              it.availabilityStatus === 'AVAILABLE'
                                ? '#166534'
                                : it.availabilityStatus === 'SUBSTITUTED'
                                ? '#92400e'
                                : '#991b1b',
                          }}
                        >
                          {it.availabilityStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {it.availabilityStatus === 'UNAVAILABLE'
                          ? '—'
                          : `LKR ${(it.actualTotalPriceMinor / 100).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Price summary */}
              <div style={{ padding: '12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Actual Items Subtotal</span>
                  <span>LKR {(order.quote.actualItemsTotalMinor / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Shopping Fee + Delivery</span>
                  <span>
                    LKR {(((order.quote.shoppingFeeMinor || 0) + (order.quote.deliveryFeeMinor || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#0D253F',
                  }}
                >
                  <span>Confirmed Revised Total</span>
                  <span style={{ color: '#0D253F' }}>
                    LKR {(order.quote.quotedTotalMinor / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval / Decline Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleApproveQuote}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(13, 37, 63, 0.2)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#1B3B5F';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#0D253F';
                }}
              >
                {actionLoading ? <Loader2 size={16} className="ue-spin" /> : <Check size={16} />}
                Approve Quote & Authorize Purchase
              </button>

              <button
                type="button"
                onClick={handleDeclineQuote}
                disabled={actionLoading}
                style={{
                  background: '#ffffff',
                  color: '#dc2626',
                  border: '1px solid #f87171',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={15} /> Decline / Revise
              </button>
            </div>
          </div>
        )}

        {/* Action feedback message */}
        {actionMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {actionMessage}
          </div>
        )}

        {/* View Paper Receipt Button (when purchased) */}
        {isPurchasedOrLater && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={22} color="#0D253F" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0D253F' }}>
                  Store Paper Receipt
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {order.receipt?.uploadedAt
                    ? `Uploaded by rider at ${new Date(order.receipt.uploadedAt).toLocaleTimeString()}`
                    : 'Receipt verified by system'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenReceipt && onOpenReceipt(order.orderId)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #0D253F',
                color: '#0D253F',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#EDF2F7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              View Receipt Photo 🧾
            </button>
          </div>
        )}

        {/* Financial Overview Card */}
        <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0D253F', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Financial Breakdown (LKR Minor Cents Calculated)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Estimated Total</div>
              <div style={{ fontWeight: 700, color: '#0D253F' }}>
                LKR {((order.pricing?.estimatedTotalMinor || 0) / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Confirmed Total</div>
              <div style={{ fontWeight: 800, color: '#0D253F' }}>
                LKR {((order.pricing?.confirmedTotalMinor || order.pricing?.estimatedTotalMinor || 0) / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Cash to Handover (COD)</div>
              <div style={{ fontWeight: 800, color: '#0D253F' }}>
                LKR {((order.pricing?.confirmedTotalMinor || order.pricing?.estimatedTotalMinor || 0) / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div style={{ fontSize: '12.5px', color: '#4b5563', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>Dropoff Address:</strong> {order.deliveryAddress || order.deliveryLocation?.address}
          </div>
          {(order.deliveryInstructions || order.deliveryLocation?.instructions) && (
            <div style={{ marginBottom: '6px' }}>
              <strong>Dropoff Instructions:</strong> {order.deliveryInstructions || order.deliveryLocation?.instructions}
            </div>
          )}
          <div>
            <strong>Substitution Policy:</strong> {order.substitutionPolicy?.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Post-Purchase Cancellation Guard */}
        {!isCancelled && order.status !== 'DELIVERED' && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={actionLoading}
              style={{
                background: 'none',
                border: 'none',
                color: isPurchasedOrLater ? '#9ca3af' : '#ef4444',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isPurchasedOrLater ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
              }}
              title={
                isPurchasedOrLater
                  ? 'Items already purchased at the shop with physical funds. Post-purchase cancellation is blocked.'
                  : 'Cancel request before items are purchased'
              }
            >
              Cancel Shopping Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
