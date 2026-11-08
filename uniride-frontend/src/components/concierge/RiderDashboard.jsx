import React, { useState, useEffect } from 'react';
import {
  Bike,
  Power,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Upload,
  Receipt,
  Navigation,
  Loader2,
  RefreshCw,
  Phone,
  Store,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export default function RiderDashboard({
  riderActor,
  onOpenReceipt,
}) {
  const [profile, setProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Quote builder state
  const [quoteItems, setQuoteItems] = useState([]);

  // Receipt uploader state
  const [receiptBase64, setReceiptBase64] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptError, setReceiptError] = useState(null);

  const actorId = riderActor?.id || 'rider-1';

  // Load rider profile, available jobs, and active order
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const headers = { 'X-Demo-Actor-Id': actorId };

      // 1. Rider profile
      const profRes = await fetch('/api/concierge/rider/profile', { headers });
      const profJson = await profRes.json();
      if (profJson.success) {
        setProfile(profJson.data || profJson.rider);
      }

      // 2. Available jobs
      const jobsRes = await fetch('/api/concierge/jobs/available', { headers });
      const jobsJson = await jobsRes.json();
      if (jobsJson.success) {
        setAvailableJobs(jobsJson.data || jobsJson.jobs || []);
      }

      // 3. Active order check
      const ordersRes = await fetch('/api/concierge/orders?limit=10', { headers });
      const ordersJson = await ordersRes.json();
      const ordersList = ordersJson.data || ordersJson.orders || [];
      if (ordersJson.success && Array.isArray(ordersList)) {
        // Find active order assigned to this rider
        const currentActive = ordersList.find(
          (o) =>
            (o.assignedRiderId === actorId || o.riderId === actorId) &&
            !['DELIVERED', 'CANCELLED'].includes(o.status)
        );
        setActiveOrder(currentActive || null);

        // Pre-fill quote items if order is in shopping phase and not yet initialized
        if (currentActive && currentActive.items && quoteItems.length === 0) {
          setQuoteItems(
            currentActive.items.map((it) => ({
              itemId: it.itemId,
              name: it.name,
              quantity: it.quantity ?? it.requestedQuantity ?? 1,
              availabilityStatus: it.availabilityStatus || 'AVAILABLE',
              actualUnitPriceLkr: ((it.estimatedUnitPriceMinor || 0) / 100).toFixed(2),
              substitutedWithName: it.substitutedWithName || '',
              substitutionNotes: it.substitutionNotes || '',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load rider dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, [actorId]);

  // Toggle Online/Offline status
  const handleToggleOnline = async () => {
    if (!profile) return;
    try {
      const nextStatus = !profile.isOnline;
      const res = await fetch('/api/concierge/rider/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
        body: JSON.stringify({ isOnline: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setProfile((prev) => ({ ...prev, isOnline: nextStatus }));
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Update GPS location to SEUSL Oluvil Campus
  const handleSetLocationToCampus = async () => {
    try {
      const res = await fetch('/api/concierge/rider/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
        body: JSON.stringify({
          coordinates: { lat: 7.2974, lng: 81.8504 },
          serviceRadiusKm: 5,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess('Rider GPS updated to South Eastern University, Oluvil');
        loadDashboardData();
      }
    } catch (err) {
      console.error('Update GPS error:', err);
    }
  };

  // Accept a job atomically
  const handleAcceptJob = async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/concierge/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not accept job');
      }

      const acceptedOrder = json.data || json.order;
      setActionSuccess(`Job ${orderId} accepted! Mission unlocked.`);
      setActiveOrder(acceptedOrder);
      // Initialize quote items for quote builder
      if (acceptedOrder && acceptedOrder.items) {
        setQuoteItems(
          acceptedOrder.items.map((it) => ({
            itemId: it.itemId,
            name: it.name,
            quantity: it.quantity ?? it.requestedQuantity ?? 1,
            availabilityStatus: 'AVAILABLE',
            actualUnitPriceLkr: ((it.estimatedUnitPriceMinor || 0) / 100).toFixed(2),
            substitutedWithName: '',
            substitutionNotes: '',
          }))
        );
      }
      loadDashboardData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 1: Start Shopping at Store
  const handleStartShopping = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/start-shopping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(json.data || json.order);
      setActionSuccess('Status updated to SHOPPING. Check shelf availability below.');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Submit Itemized Quote
  const handleSubmitQuote = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    setActionError(null);

    const payloadItems = quoteItems.map((it) => {
      const unitLkr = parseFloat(it.actualUnitPriceLkr) || 0;
      return {
        name: it.name,
        quantity: it.quantity,
        availabilityStatus: it.availabilityStatus,
        actualUnitPriceMinor: Math.round(unitLkr * 100),
        substitutedWithName: it.substitutedWithName?.trim() || undefined,
        substitutionNotes: it.substitutionNotes?.trim() || undefined,
      };
    });

    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
        body: JSON.stringify({ items: payloadItems }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(json.data || json.order);
      setActionSuccess('Quote submitted to customer for approval!');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Receipt File Selection (Validate size <= 5MB and magic bytes)
  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setReceiptError('Receipt photo must be smaller than 5 MB.');
      return;
    }

    setReceiptError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      setReceiptBase64(b64);
      setReceiptPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  // Upload Receipt Photo
  const handleUploadReceipt = async () => {
    if (!activeOrder || !receiptBase64) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
        body: JSON.stringify({ receiptBase64 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(json.data || json.order);
      setActionSuccess('Paper receipt photo validated and attached to order!');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Confirm Purchase & Pay Cash at Counter
  const handleConfirmPurchase = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(json.data || json.order);
      setActionSuccess('Purchase confirmed with counter cash! Post-purchase cancellation guard is now active.');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Head Out for Delivery
  const handleOutForDelivery = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(json.data || json.order);
      setActionSuccess('Order marked OUT FOR DELIVERY. Head to the student customer!');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: Deliver & Collect Cash (COD)
  const handleCompleteDelivery = async () => {
    if (!activeOrder) return;
    const confirmedTotalMinor =
      activeOrder.pricing?.confirmedTotalMinor || activeOrder.pricing?.estimatedTotalMinor || 0;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/concierge/orders/${activeOrder.orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Actor-Id': actorId,
        },
        body: JSON.stringify({ cashCollectedMinor: confirmedTotalMinor }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setActiveOrder(null);
      setActionSuccess('Delivery completed! Cash collected and demonstration earnings credited.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
        <Loader2 size={32} className="ue-spin" style={{ margin: '0 auto 12px' }} />
        <div>Connecting to Student Rider Dispatch Terminal...</div>
      </div>
    );
  }

  const isOnline = profile?.isOnline !== false;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '16px' }}>
      {/* Rider Header Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0D253F 0%, #1E4E79 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(13, 37, 63, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🛵
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                  {profile?.name || 'Kasun Perera'}
                </h1>
                <span style={{ fontSize: '12px', background: isOnline ? '#FEF3C7' : '#fee2e2', color: isOnline ? '#B45309' : '#991b1b', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px', color: '#CBD5E1' }}>
                {profile?.vehicle || 'Honda Dio 110'} • {profile?.phone || '+94 77 812 3401'} • 4.8 ★
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleToggleOnline}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isOnline ? 'rgba(255,255,255,0.18)' : '#F59E0B',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <Power size={14} />
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>

            <button
              type="button"
              onClick={handleSetLocationToCampus}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Set GPS to SEUSL Oluvil Campus"
            >
              <Navigation size={13} /> Set GPS (7.2974, 81.8504)
            </button>
          </div>
        </div>

        {/* Demo Wallet & Stats Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Virtual Demo Wallet
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              LKR {(((profile?.demoLedgerBalanceMinor || 0)) / 100).toFixed(2)}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Missions
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
              {profile?.completedDeliveries || 42}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Mission Status
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: activeOrder ? '#fbbf24' : '#9ca3af', marginTop: '4px' }}>
              {activeOrder ? activeOrder.status.replace(/_/g, ' ') : 'Ready for Next Job'}
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {actionError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}
      {actionSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          {actionSuccess}
        </div>
      )}

      {/* ACTIVE MISSION CARD (IF ASSIGNED) */}
      {activeOrder && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #0D253F',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 8px 24px rgba(13, 37, 63, 0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <div>
              <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Active Shopping Mission • {activeOrder.orderId}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0D253F', margin: '6px 0 2px' }}>
                Shop: {activeOrder.shop?.name || activeOrder.shopDetails?.name}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                {activeOrder.shop?.address || activeOrder.shopDetails?.address}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Status
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0D253F' }}>
                {activeOrder.status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Unlocked Customer Privacy Details */}
          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              Customer Handover Details (Unlocked)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
              <div>
                <strong>Customer:</strong> {activeOrder.customerName || activeOrder.customerSnapshot?.name}
              </div>
              <div>
                <strong>Phone:</strong> {activeOrder.customerPhone || activeOrder.customerSnapshot?.phone}
              </div>
              <div>
                <strong>Dropoff Location:</strong> {activeOrder.deliveryAddress || activeOrder.deliveryLocation?.address}
              </div>
              <div>
                <strong>Substitution Policy:</strong> {activeOrder.substitutionPolicy?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* STEP 1: ARRIVE AT SHOP */}
          {activeOrder.status === 'ASSIGNED' && (
            <div style={{ textAlign: 'center', padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <Store size={36} color="#0D253F" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0D253F', margin: '0 0 6px' }}>
                Step 1: Ride to {activeOrder.shopDetails?.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '460px', margin: '0 auto 16px' }}>
                Travel to the physical shop location. Once you enter the shop, click below to start inspecting shelves.
              </p>
              <button
                type="button"
                onClick={handleStartShopping}
                disabled={actionLoading}
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(13, 37, 63, 0.2)',
                  transition: 'background 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#1B3B5F';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#0D253F';
                }}
              >
                {actionLoading ? <Loader2 size={16} className="ue-spin" /> : <Store size={16} />}
                I Have Arrived at the Shop (Start Shopping)
              </button>
            </div>
          )}

          {/* STEP 2: QUOTE BUILDER (SHOPPING PHASE) */}
          {activeOrder.status === 'SHOPPING' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                Step 2: Inspect Shelves & Prepare Itemized Quote
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                Verify what's available in the store. Enter actual shelf prices in LKR. If an item is out of stock, mark it as unavailable or offer a substitute:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {quoteItems.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '12px',
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                        {idx + 1}. {it.name} (Qty: {it.quantity})
                      </span>

                      {/* Availability status picker */}
                      <select
                        value={it.availabilityStatus}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuoteItems((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, availabilityStatus: val } : item))
                          );
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <option value="AVAILABLE">✓ Available</option>
                        <option value="SUBSTITUTED">🔄 Substituted</option>
                        <option value="UNAVAILABLE">✕ Out of Stock</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                          Actual Shelf Price (LKR per unit)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.actualUnitPriceLkr}
                          disabled={it.availabilityStatus === 'UNAVAILABLE'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, actualUnitPriceLkr: val } : item))
                            );
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '12.5px',
                          }}
                        />
                      </div>

                      {it.availabilityStatus === 'SUBSTITUTED' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                            Substituted Item Name
                          </label>
                          <input
                            type="text"
                            value={it.substitutedWithName}
                            placeholder="e.g. Maliban Milk 400g"
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuoteItems((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, substitutedWithName: val } : item))
                              );
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '12.5px',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={actionLoading}
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                {actionLoading ? <Loader2 size={16} className="ue-spin" /> : <ArrowRight size={16} />}
                Send Quote to Customer for Approval
              </button>
            </div>
          )}

          {/* STEP 2 WAITING APPROVAL */}
          {activeOrder.status === 'AWAITING_CUSTOMER_APPROVAL' && (
            <div style={{ textAlign: 'center', padding: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <Clock size={32} color="#2563eb" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af', margin: '0 0 6px' }}>
                Waiting for Customer Approval
              </h3>
              <p style={{ fontSize: '13px', color: '#1d4ed8', maxWidth: '440px', margin: '0 auto 12px' }}>
                The quote has been sent to the student customer. Once approved, you can pay cash at the register and upload the receipt.
              </p>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                (Tip: Use the persona switcher in the top right to switch to <strong>Ruvini (Customer)</strong> to approve the quote!)
              </div>
            </div>
          )}

          {/* STEP 3: RECEIPT UPLOAD & PURCHASE CONFIRMATION */}
          {activeOrder.status === 'PURCHASE_APPROVED' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                Step 3: Pay at Counter & Upload Store Receipt
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                Customer approved the quote! Pay the shop cashier using physical funds, photograph the official paper receipt, and confirm purchase below:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Store Paper Receipt Photo (Magic bytes validated JPEG/PNG/WebP, &lt; 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFileChange}
                    style={{ fontSize: '13px' }}
                  />
                  {receiptError && (
                    <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                      {receiptError}
                    </div>
                  )}

                  {receiptBase64 && !activeOrder.receipt?.receiptId && (
                    <button
                      type="button"
                      onClick={handleUploadReceipt}
                      disabled={actionLoading}
                      style={{
                        marginTop: '10px',
                        background: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Upload size={14} /> Upload Receipt Photo
                    </button>
                  )}
                </div>

                <div>
                  {receiptPreview && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={actionLoading}
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                {actionLoading ? <Loader2 size={16} className="ue-spin" /> : <CheckCircle size={16} />}
                Confirm Purchase (Cash Paid at Counter)
              </button>
            </div>
          )}

          {/* STEP 4: OUT FOR DELIVERY */}
          {activeOrder.status === 'PURCHASED' && (
            <div style={{ textAlign: 'center', padding: '24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <Package size={36} color="#0D253F" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0D253F', margin: '0 0 6px' }}>
                Items Purchased! Ready to Deliver
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '0 auto 16px' }}>
                Items are in hand. Click below when you start riding to the student customer's room or faculty:
              </p>
              <button
                type="button"
                onClick={handleOutForDelivery}
                disabled={actionLoading}
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
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
                {actionLoading ? <Loader2 size={16} className="ue-spin" /> : <Bike size={16} />}
                Start Delivery (Ride to Customer)
              </button>
            </div>
          )}

          {/* STEP 5: HANDOVER & COLLECT CASH (COD) */}
          {activeOrder.status === 'OUT_FOR_DELIVERY' && (
            <div style={{ textAlign: 'center', padding: '24px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
              <DollarSign size={36} color="#F59E0B" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#92400E', margin: '0 0 6px' }}>
                Deliver & Collect Cash on Delivery (COD)
              </h3>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0D253F', margin: '8px 0' }}>
                Collect Cash: LKR {(((activeOrder.pricing?.confirmedTotalMinor || activeOrder.pricing?.estimatedTotalMinor || 0)) / 100).toFixed(2)}
              </div>
              <p style={{ fontSize: '13px', color: '#B45309', maxWidth: '460px', margin: '0 auto 16px' }}>
                Hand the physical items and store paper receipt to {activeOrder.customerSnapshot?.name} at <strong>{activeOrder.deliveryLocation?.address}</strong>. Once cash is collected, complete delivery below:
              </p>
              <button
                type="button"
                onClick={handleCompleteDelivery}
                disabled={actionLoading}
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(13, 37, 63, 0.25)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#1B3B5F';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.currentTarget.style.background = '#0D253F';
                }}
              >
                {actionLoading ? <Loader2 size={18} className="ue-spin" /> : <CheckCircle size={18} />}
                Order Handed Over & Cash Collected (Complete Settlement)
              </button>
            </div>
          )}
        </div>
      )}

      {/* AVAILABLE JOBS BOARD */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>
              Available Concierge Shopping Jobs ({availableJobs.length})
            </h2>
            <div style={{ fontSize: '12.5px', color: '#6b7280' }}>
              Orders waiting for student rider assignment near campus.
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f3f4f6',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'ue-spin' : ''} />
            Refresh Board
          </button>
        </div>

        {availableJobs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px dashed #d1d5db',
              color: '#6b7280',
            }}
          >
            <Bike size={36} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>
              No Open Shopping Jobs Right Now
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              New orders submitted by students around campus will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {availableJobs.map((job) => (
              <div
                key={job.orderId}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: '4px' }}>
                      {job.orderId}
                    </span>
                    <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700 }}>
                      Earn ~LKR {(((job.pricing?.estimatedTotalMinor || 0) * 0.3) / 100).toFixed(2)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                    {job.shop?.name || job.shopDetails?.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                    {job.shop?.address || job.shopDetails?.address}
                  </div>

                  {/* Privacy Guard Notice */}
                  <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px 10px', fontSize: '11.5px', color: '#4b5563', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                      {job.itemCount || job.items?.length || 1} items requested
                    </div>
                    <div>General Area: {job.deliveryAreaPublic || job.deliveryLocation?.area || 'Campus Vicinity'}</div>
                    <div style={{ color: '#9ca3af', marginTop: '2px', fontStyle: 'italic' }}>
                      Exact room & phone revealed upon accepting job.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAcceptJob(job.orderId)}
                  disabled={actionLoading || Boolean(activeOrder)}
                  style={{
                    width: '100%',
                    background: activeOrder ? '#94A3B8' : '#0D253F',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: activeOrder ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: activeOrder ? 'none' : '0 4px 14px rgba(13, 37, 63, 0.2)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading && !activeOrder) e.currentTarget.style.background = '#1B3B5F';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading && !activeOrder) e.currentTarget.style.background = '#0D253F';
                  }}
                  title={activeOrder ? 'Complete your current active mission first' : 'Accept job atomically'}
                >
                  <Bike size={15} />
                  <span>Accept Delivery Job</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
