import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShoppingBag,
  BookOpen,
  Utensils,
  Pill,
  Store,
  Clock,
  Sparkles,
  Info,
  Navigation,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Shops', icon: Store },
  { id: 'food', label: 'Food & Dining', icon: Utensils },
  { id: 'grocery', label: 'Groceries & Marts', icon: ShoppingBag },
  { id: 'stationery', label: 'Stationery & Books', icon: BookOpen },
  { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
];

export default function ConciergeShopDiscovery({
  coords,
  onSelectShop,
  actor,
  onUpdateCoords,
}) {
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metaInfo, setMetaInfo] = useState(null);

  const fetchShops = async () => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const headers = {
        'Content-Type': 'application/json',
      };
      if (actor?.id) {
        headers['X-Demo-Actor-Id'] = actor.id;
      }

      const res = await fetch(
        `/api/concierge/discovery/shops?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusMeters}${categoryParam}`,
        { headers }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Discovery failed with HTTP ${res.status}`);
      }

      setShops(json.shops || []);
      setMetaInfo({
        count: json.count,
        stale: json.stale,
        staleReason: json.staleReason,
        cacheStatus: json.cacheStatus,
        attribution: json.attribution,
        attributionUrl: json.attributionUrl,
        providerAvailable: json.providerAvailable,
      });
    } catch (err) {
      console.error('Concierge shop discovery error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [coords?.lat, coords?.lng, radiusMeters, selectedCategory]);

  const filteredShops = shops.filter((shop) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = shop.name?.toLowerCase().includes(q);
    const catMatch = shop.category?.toLowerCase().includes(q);
    const addrMatch = shop.address?.formatted?.toLowerCase().includes(q);
    const altMatch = Array.isArray(shop.altNames) && shop.altNames.some((alt) => alt.toLowerCase().includes(q));
    return nameMatch || catMatch || addrMatch || altMatch;
  });

  return (
    <div className="ue-concierge-discovery-container" style={{ margin: '16px 0 32px' }}>
      {/* Top Banner / Hero Info */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0D253F 0%, #1E4E79 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '22px 26px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(13, 37, 63, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FCD34D', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <Compass size={14} color="#F59E0B" /> Live OpenStreetMap Discovery • 2km Concierge
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 8px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Nearby University Shops & Student Concierge
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.5, margin: 0, color: '#F1F5F9' }}>
              Order from any real physical shop near campus. A trusted peer student rider shops in person, verifies availability and prices, sends you an itemized receipt, and delivers straight to your hostel or faculty.
            </p>
          </div>

          {/* Quick campus preset chip */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onUpdateCoords && onUpdateCoords({ lat: 7.2974, lng: 81.8504 }, 'South Eastern University, Oluvil')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                color: '#0D253F',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              <Navigation size={14} color="#F59E0B" />
              Reset to SEUSL Oluvil Campus (7.2974, 81.8504)
            </button>
            <span style={{ fontSize: '11px', opacity: 0.8, color: '#CBD5E1' }}>
              Active GPS: ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </span>
          </div>
        </div>
      </div>

      {/* Discovery Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(13, 37, 63, 0.04)',
        }}
      >
        {/* Radius Pill Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Radius:</span>
          {[1000, 2000, 3000, 5000].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadiusMeters(r)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                background: radiusMeters === r ? '#0D253F' : '#EDF2F7',
                color: radiusMeters === r ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {r / 1000} km {r === 2000 ? '(Default)' : ''}
            </button>
          ))}
        </div>

        {/* Search Inside Discovered Shops */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px', flex: '1', maxWidth: '380px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: '#EDF2F7',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '7px 12px',
            }}
          >
            <Search size={15} color="#64748B" style={{ marginRight: '6px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter nearby shops or items..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                color: '#0D253F',
              }}
            />
          </div>
          <button
            type="button"
            onClick={fetchShops}
            disabled={loading}
            title="Refresh nearby shops"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              background: '#EDF2F7',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'ue-spin' : ''} color="#0D253F" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 700,
                border: active ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                background: active ? '#FEF3C7' : '#ffffff',
                color: active ? '#B45309' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 2px 6px rgba(245, 158, 11, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} color={active ? '#B45309' : '#64748B'} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Stale Cache Notice */}
      {metaInfo?.stale && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            color: '#92400e',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          <Info size={16} color="#d97706" />
          <span>
            <strong>Local Campus Cache Active:</strong> Overpass API responded slowly, so we served verified campus places from our local spatial database.
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <strong>Could not discover shops:</strong> {error}
          <button
            type="button"
            onClick={fetchShops}
            style={{
              marginLeft: '12px',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                height: '190px',
                background: '#f3f4f6',
                borderRadius: '14px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredShops.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #d1d5db',
          }}
        >
          <Store size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>
            No shops found within {radiusMeters / 1000} km
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '420px', margin: '0 auto 16px' }}>
            Try increasing the search radius to 3 km or 5 km, switching categories, or resetting your coordinates to South Eastern University campus.
          </p>
          <button
            type="button"
            onClick={() => {
              setRadiusMeters(5000);
              setSelectedCategory('all');
            }}
            style={{
              background: '#0D253F',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3B5F')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0D253F')}
          >
            Expand Radius to 5 km
          </button>
        </div>
      )}

      {/* Discovered Shops Grid */}
      {!loading && !error && filteredShops.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
          {filteredShops.map((shop) => {
            const isPharmacy = shop.category === 'pharmacy';
            const isStationery = shop.category === 'stationery';
            const isGrocery = shop.category === 'grocery';
            const isFood = shop.category === 'food';

            return (
              <div
                key={shop.externalId || shop._id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(13, 37, 63, 0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  {/* Category & Accuracy Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isPharmacy
                          ? '#fef2f2'
                          : isStationery
                          ? '#eff6ff'
                          : isGrocery
                          ? '#FEF3C7'
                          : '#fff7ed',
                        color: isPharmacy
                          ? '#991b1b'
                          : isStationery
                          ? '#1e40af'
                          : isGrocery
                          ? '#B45309'
                          : '#9a3412',
                      }}
                    >
                      {isPharmacy && <Pill size={12} />}
                      {isStationery && <BookOpen size={12} />}
                      {isGrocery && <ShoppingBag size={12} />}
                      {isFood && <Utensils size={12} />}
                      {shop.osmSubcategory || shop.category}
                    </span>

                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                      {shop.straightLineDistanceMeters}m direct • ~{shop.estimatedRoadDistanceKm}km road
                    </span>
                  </div>

                  {/* Shop Name */}
                  <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0D253F', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {shop.name}
                  </h3>

                  {/* Alt Names (Tamil / Sinhala if available in OSM) */}
                  {Array.isArray(shop.altNames) && shop.altNames.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                      {shop.altNames.slice(0, 2).join(' • ')}
                    </div>
                  )}

                  {/* Address & Hours */}
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                    {shop.address?.formatted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <MapPin size={13} color="#94A3B8" />
                        <span>{shop.address.formatted}</span>
                      </div>
                    )}
                    {shop.openingHours && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="#94A3B8" />
                        <span>{shop.openingHours}</span>
                      </div>
                    )}
                    {shop.coordinatesApprox && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
                        Approximate shop center (OSM {shop.osmType})
                      </div>
                    )}
                  </div>

                  {/* Mandatory Concierge Notice */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderLeft: '3px solid #F59E0B',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      color: '#334155',
                      lineHeight: 1.4,
                      marginBottom: '14px',
                    }}
                  >
                    {shop.conciergeNotice ||
                      'An independent rider shops here on your behalf. Prices and availability are confirmed before purchase.'}
                  </div>
                </div>

                {/* Footer Action */}
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectShop(shop)}
                    style={{
                      width: '100%',
                      background: '#0D253F',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(13, 37, 63, 0.15)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3B5F')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0D253F')}
                  >
                    <span>Request Rider to Shop Here</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OSM Attribution Footer */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '12px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: '#64748B',
        }}
      >
        <span>
          Nearby place data sourced via{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0D253F', textDecoration: 'underline', fontWeight: 600 }}
          >
            © OpenStreetMap contributors
          </a>
          .
        </span>
        <span>Independent shops are fulfilled via peer student concierge.</span>
      </div>
    </div>
  );
}
