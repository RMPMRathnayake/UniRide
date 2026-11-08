import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Info,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pill,
  BookOpen,
  ShoppingBag,
  Utensils,
} from 'lucide-react';

export default function ConciergeShopRequestView({
  shop,
  onBack,
  actor,
  defaultAddress,
  deliveryCoords,
  onOrderCreated,
}) {
  const [catalogItems, setCatalogItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [requestItems, setRequestItems] = useState([]);
  const [substitutionPolicy, setSubstitutionPolicy] = useState('ASK_BEFORE_SUBSTITUTING');
  const [deliveryAddress, setDeliveryAddress] = useState(
    defaultAddress || 'South Eastern University, Oluvil'
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Custom Item Form
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customBrand, setCustomBrand] = useState('');
  const [customPriceEstimate, setCustomPriceEstimate] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Live backend estimate
  const [estimate, setEstimate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch generic master catalog templates for stationery/grocery
  useEffect(() => {
    if (!shop || (shop.category !== 'stationery' && shop.category !== 'grocery')) {
      setCatalogItems([]);
      return;
    }

    setLoadingCatalog(true);
    fetch(`/api/concierge/catalog?category=${shop.category}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.items)) {
          setCatalogItems(json.items);
        }
      })
      .catch((err) => console.error('Failed to load master catalog:', err))
      .finally(() => setLoadingCatalog(false));
  }, [shop?.category]);

  // Recalculate live estimate via POST /api/concierge/orders/estimate
  useEffect(() => {
    if (!shop || requestItems.length === 0) {
      setEstimate(null);
      return;
    }

    const payload = {
      shopCoordinates: {
        lat: shop.lat || shop.location?.coordinates?.[1] || 7.2974,
        lng: shop.lng || shop.location?.coordinates?.[0] || 81.8504,
      },
      deliveryCoordinates: deliveryCoords || { lat: 7.2974, lng: 81.8504 },
      items: requestItems.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        estimatedUnitPriceMinor: it.estimatedUnitPriceMinor || 0,
      })),
    };

    fetch('/api/concierge/orders/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setEstimate(json.estimate);
        }
      })
      .catch((err) => console.error('Estimate calculation failed:', err));
  }, [requestItems, shop, deliveryCoords]);

  // Add template item to request
  const handleAddTemplateItem = (item) => {
    setRequestItems((prev) => {
      const existing = prev.find((i) => i.templateKey === item.templateKey);
      if (existing) {
        return prev.map((i) =>
          i.templateKey === item.templateKey ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          templateKey: item.templateKey,
          name: item.name,
          quantity: 1,
          unit: item.unit,
          estimatedUnitPriceMinor: item.estimatedPriceMinor,
          notes: '',
          isCustom: false,
        },
      ];
    });
  };

  // Add custom item
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const parsedPrice = parseFloat(customPriceEstimate);
    const priceMinor = !isNaN(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice * 100) : 0;

    const newItem = {
      name: customName.trim(),
      quantity: Math.max(1, parseInt(customQty, 10) || 1),
      preferredBrand: customBrand.trim(),
      estimatedUnitPriceMinor: priceMinor,
      notes: customNotes.trim(),
      isCustom: true,
    };

    setRequestItems((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomQty(1);
    setCustomBrand('');
    setCustomPriceEstimate('');
    setCustomNotes('');
  };

  const handleUpdateQty = (index, delta) => {
    setRequestItems((prev) =>
      prev
        .map((it, idx) => {
          if (idx !== index) return it;
          const nextQty = it.quantity + delta;
          return nextQty > 0 ? { ...it, quantity: nextQty } : null;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (index) => {
    setRequestItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit concierge order
  const handleSubmitOrder = async () => {
    if (requestItems.length === 0) {
      setSubmitError('Please add at least one item to your request.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setSubmitError('Please enter your delivery address or hostel room.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const shopLat = shop.lat || shop.location?.coordinates?.[1] || 7.2974;
    const shopLng = shop.lng || shop.location?.coordinates?.[0] || 81.8504;

    const orderPayload = {
      idempotencyKey,
      shop: {
        externalId: shop.externalId || shop._id,
        name: shop.name,
        category: shop.category || 'grocery',
        address:
          shop.address?.formatted ||
          (typeof shop.address === 'string' ? shop.address : 'Campus Vicinity'),
        coordinates: { lat: shopLat, lng: shopLng },
      },
      items: requestItems.map((it) => ({
        name: it.name,
        requestedQuantity: it.quantity,
        templateId: it.templateKey || null,
        preferredBrand: it.preferredBrand || '',
        notes: it.notes || '',
        estimatedUnitPriceMinor: it.estimatedUnitPriceMinor || 0,
      })),
      substitutionPolicy:
        substitutionPolicy === 'ASK_BEFORE_SUBSTITUTING' ? 'ASK_FIRST' : substitutionPolicy,
      deliveryAddress: deliveryAddress.trim(),
      deliveryInstructions: deliveryInstructions.trim(),
      deliveryCoordinates: {
        lat: deliveryCoords?.lat || 7.2974,
        lng: deliveryCoords?.lng || 81.8504,
      },
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (actor?.id) {
        headers['X-Demo-Actor-Id'] = actor.id;
      }

      const res = await fetch('/api/concierge/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit concierge order');
      }

      const createdOrder = json.data || json.order;
      if (onOrderCreated && createdOrder) {
        onOrderCreated(createdOrder);
      }
    } catch (err) {
      console.error('Submit order error:', err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      {/* Back Button */}
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
        Back to Nearby Shops
      </button>

      {/* Shop Info Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(13, 37, 63, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', marginBottom: '8px' }}>
              <Store size={13} color="#B45309" />
              Independent OpenStreetMap Shop
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0D253F', margin: '0 0 6px' }}>
              {shop.name}
            </h1>
            <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              {shop.address?.formatted && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#9ca3af" />
                  {shop.address.formatted}
                </span>
              )}
              <span>
                {shop.straightLineDistanceMeters}m direct • ~{shop.estimatedRoadDistanceKm}km road
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Independent Shop Notice */}
        <div
          style={{
            marginTop: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#166534',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          <strong>Independent Rider Concierge Notice:</strong> An independent student rider shops here on your behalf. Prices and availability are verified at the shop and confirmed with you via an itemized quote before purchase.
        </div>
      </div>

      {/* Category Specific Notice */}
      {shop.category === 'pharmacy' && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            color: '#991b1b',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>
              Pharmacy / Health Items Safety Policy
            </h4>
            <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Pharmacies are discoverable places only. Prescription medicines and regulated pharmaceutical products are never cataloged automatically. Please submit a custom request below with your exact OTC requirement or prescription details. Your student rider will verify availability with the licensed pharmacist on duty.
            </p>
          </div>
        </div>
      )}

      {shop.category === 'food' && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            color: '#9a3412',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <Utensils size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>
              Restaurant / Food Counter Ordering
            </h4>
            <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Student riders order meals directly at the restaurant counter. Enter your favorite dishes (e.g., Chicken Fried Rice, Kottu, String Hoppers, Short Eats) in the custom item form below with any spice or dietary preferences.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: Templates + Custom Item Request Form */}
        <div>
          {/* Master Catalog Templates (Stationery & Grocery only) */}
          {(shop.category === 'stationery' || shop.category === 'grocery') && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                Generic Master Catalog Suggestions
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px' }}>
                Quick-add common campus items. Estimated prices are approximate; actual prices are confirmed at the shop.
              </p>

              {loadingCatalog ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                  Loading suggestions...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                  {catalogItems.map((item) => (
                    <div
                      key={item.templateKey}
                      style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0D253F' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 6px' }}>
                          {item.description} ({item.unit})
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D253F', marginBottom: '8px' }}>
                          ~LKR {(item.estimatedPriceMinor / 100).toFixed(2)} (Estimated)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddTemplateItem(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          background: '#ffffff',
                          border: '1.5px solid #0D253F',
                          color: '#0D253F',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} /> Add to Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Item Request Form */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              Add Custom Item Request
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px' }}>
              Need something specific or from the menu? Describe it below and your rider will locate it.
            </p>

            <form onSubmit={handleAddCustomItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. CR 120-page Ruled Book or Chicken Kottu"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Preferred Brand / Spec
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Atlas, Keells, Maliban"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Estimated Unit Price (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPriceEstimate}
                    onChange={(e) => setCustomPriceEstimate(e.target.value)}
                    placeholder="e.g. 450"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Special Instructions for Rider
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. If 120-page not available, 160-page is fine"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#0D253F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(13, 37, 63, 0.15)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3B5F')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0D253F')}
              >
                <Plus size={15} /> Add Item to Request
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary, Substitution Policy & Checkout */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(13, 37, 63, 0.05)',
            position: 'sticky',
            top: '80px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D253F', margin: '0 0 14px' }}>
            Shopping List ({requestItems.length} {requestItems.length === 1 ? 'item' : 'items'})
          </h3>

          {/* Items list */}
          {requestItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '13px' }}>
              No items added yet. Click suggestions or add a custom item above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
              {requestItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ maxWidth: '180px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                      {it.name}
                    </div>
                    {it.preferredBrand && (
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        Brand: {it.preferredBrand}
                      </div>
                    )}
                    {it.estimatedUnitPriceMinor > 0 && (
                      <div style={{ fontSize: '11px', color: '#0D253F', fontWeight: 700 }}>
                        ~LKR {((it.estimatedUnitPriceMinor * it.quantity) / 100).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      style={{
                        padding: '2px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      style={{
                        padding: '2px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        padding: '2px',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        marginLeft: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Substitution Policy Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              Substitution Policy
            </label>
            <select
              value={substitutionPolicy}
              onChange={(e) => setSubstitutionPolicy(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="ASK_BEFORE_SUBSTITUTING">
                📞 Call / message me before substituting (Recommended)
              </option>
              <option value="NO_SUBSTITUTIONS">
                🚫 Do not substitute (Omit if not in stock)
              </option>
              <option value="SUBSTITUTE_SIMILAR_WITHIN_BUDGET">
                🔄 Replace with similar brand within 15% budget
              </option>
            </select>
          </div>

          {/* Delivery Location & Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
              Delivery Hostel / Faculty Address
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Faculty of Technology, Room 302"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none',
              }}
            />
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Notes for rider (e.g. Leave at gate if in class)"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Live Cost Estimate Breakdown */}
          {estimate && (
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '12px',
                border: '1px solid #f3f4f6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280' }}>Items Estimated Subtotal</span>
                <span>LKR {(estimate.estimatedSubtotalMinor / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280' }}>Student Concierge Fee</span>
                <span>LKR {(estimate.shoppingFeeMinor / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Delivery Fee ({estimate.estimatedRoadDistanceKm} km road)</span>
                <span>LKR {(estimate.deliveryFeeMinor / 100).toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #E2E8F0',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#0D253F',
                }}
              >
                <span>Estimated Total</span>
                <span style={{ color: '#0D253F' }}>
                  LKR {(estimate.estimatedTotalMinor / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#991b1b',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || requestItems.length === 0}
            style={{
              width: '100%',
              background: isSubmitting || requestItems.length === 0 ? '#94A3B8' : '#0D253F',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting || requestItems.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(13, 37, 63, 0.2)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && requestItems.length > 0) e.currentTarget.style.background = '#1B3B5F';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && requestItems.length > 0) e.currentTarget.style.background = '#0D253F';
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="ue-spin" />
                Dispatching to Student Riders...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Concierge Request (COD)
              </>
            )}
          </button>

          <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '10px', lineHeight: 1.4 }}>
            Cash on Delivery (COD) payment upon physical handover. Quote will be approved before purchase.
          </div>
        </div>
      </div>
    </div>
  );
}
