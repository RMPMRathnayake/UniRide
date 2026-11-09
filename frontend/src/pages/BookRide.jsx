import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import RouteMap from '../components/RouteMap';
import LocationSearch from '../components/LocationSearch';
import { Button, CardHeading, money, PageHeader } from '../components/UI';

const rideTypes = [
  { id: 'Bike', label: 'Bike', description: 'Quick and affordable campus travel', multiplier: 0.85, eta: '3–6 min' },
  { id: 'Three Wheeler', label: 'Three Wheeler', description: 'Convenient travel with extra space', multiplier: 1, eta: '4–8 min' }
];
export default function BookRide() {
  const navigate = useNavigate();
  const mapCardRef = useRef(null);
  const reverseLookupIdRef = useRef(0);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideType, setRideType] = useState('Bike');
  const [route, setRoute] = useState(null);
  const [routeRequestId, setRouteRequestId] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [pickMode, setPickMode] = useState('');
  const [pickLoading, setPickLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState({ baseFare: 100, perKmRate: 50 });
  useEffect(() => { api.get('/pricing').then(({ data }) => setPricing(data.item)).catch(() => {}); }, []);
  const handleRoute = useCallback((next) => setRoute(next), []);
  const handleRouteLoading = useCallback((value) => setRouteLoading(value), []);
  const startMapPick = (which) => {
    setPickMode(which);
    mapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const updateLocation = (which, value) => {
    reverseLookupIdRef.current += 1;
    setPickLoading(false);
    if (which === 'pickup') setPickup(value);
    else setDestination(value);
    setRoute(null);
    setRouteLoading(false);
    setRouteRequestId((current) => current + 1);
    setPickMode('');
    setError('');
  };
  const distance = route?.distanceKm || 0;
  const duration = route?.durationMin || 0;
  const selected = rideTypes.find((x) => x.id === rideType);
  const fare = useMemo(() => distance ? Math.round((pricing.baseFare + Math.max(distance, 0.8) * pricing.perKmRate) * (selected?.multiplier || 1)) : 0, [distance, selected, pricing]);

  const pickFromMap = ({ lat, lng }) => {
    const which = pickMode;
    if (!which) return;
    const coordinates = [lng, lat];
    const fallbackPlace = {
      address: `Selected map point (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      coordinates
    };

    // Accept coordinates immediately; resolve the readable address in the background.
    updateLocation(which, fallbackPlace);
    const lookupId = ++reverseLookupIdRef.current;
    setPickLoading(true);
    api.get('/geocoding/reverse', { params: { lat, lon: lng }, timeout: 10000 })
      .then(({ data }) => {
        if (lookupId !== reverseLookupIdRef.current || !data.place?.address) return;
        const updateIfStillSelected = (current) =>
          current?.coordinates?.[0] === lng && current?.coordinates?.[1] === lat
            ? { ...current, address: data.place.address }
            : current;
        if (which === 'pickup') setPickup(updateIfStillSelected);
        else setDestination(updateIfStillSelected);
      })
      .catch(() => {
        // The coordinate-only selection remains valid for routing and booking.
      })
      .finally(() => {
        if (lookupId === reverseLookupIdRef.current) setPickLoading(false);
      });
  };

  const book = async () => {
    setError('');
    if (!pickup || !destination) { setError('Choose both pickup and destination locations.'); return; }
    if (!route) { setError('Wait for the driving route to finish calculating before confirming your ride.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/rides', { pickup, destination, rideType, distanceKm: distance, durationMin: duration });
      navigate('/rider/active', { state: { notice: data.message } });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return <>
    <PageHeader title="Book a ride" subtitle="Choose your pickup and destination using OpenStreetMap, then review the calculated driving route." />
    <div className="booking-layout">
      <div className="booking-form-column">
        <section className="content-card booking-card">
          <CardHeading title="Your route" subtitle="Search for a place or pick your pickup and destination directly on the map." />
          <div className="booking-route-fields">
            <LocationSearch label="Pickup location" value={pickup} onChange={(value) => updateLocation('pickup', value)} placeholder="Where should we pick you up?" onPickOnMap={() => startMapPick('pickup')} picking={pickMode === 'pickup'} />
            <div className="route-connector-line"><span></span></div>
            <LocationSearch label="Destination" value={destination} onChange={(value) => updateLocation('destination', value)} placeholder="Where are you going?" onPickOnMap={() => startMapPick('destination')} picking={pickMode === 'destination'} />
          </div>
          {pickLoading && <div className="route-action-note">Finding the selected address…</div>}
        </section>
        <section className="content-card">
          <CardHeading title="Choose your ride" subtitle="Select the vehicle that suits your journey." />
          <div className="ride-type-list">{rideTypes.map((item) => {
            const itemFare = distance ? Math.round((pricing.baseFare + Math.max(distance, 0.8) * pricing.perKmRate) * item.multiplier) : null;
            return <button type="button" key={item.id} className={`ride-type-option ${rideType === item.id ? 'selected' : ''}`} onClick={() => setRideType(item.id)}>
              <span className="ride-type-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="ride-type-eta">{item.eta}</span>
              <strong className="ride-type-price">{itemFare === null ? '—' : money(itemFare)}</strong>
              <i className="radio-dot"></i>
            </button>;
          })}</div>
        </section>
        {error && <div className="alert alert-error">{error}</div>}
        <section className="content-card booking-total-card">
          <div><span>Estimated fare</span><strong>{route ? money(fare) : '—'}</strong><small>{route ? 'Based on the calculated road route and selected ride type.' : 'Choose both locations to calculate your estimated fare.'}</small></div>
          <Button onClick={book} disabled={busy || !route}>{busy ? 'Booking…' : 'Confirm ride'}</Button>
        </section>
      </div>
      <div className="booking-map-column">
        <section className="content-card map-card" ref={mapCardRef}>
          <CardHeading title="Route preview" subtitle="Select both locations to calculate the driving route." />
          <RouteMap origin={pickup} destination={destination} height={370} onRoute={handleRoute} onRouteLoading={handleRouteLoading} calculateRoute={Boolean(pickup && destination)} routeRequestId={routeRequestId} pickMode={pickLoading ? '' : pickMode} onMapPick={pickFromMap} />
          <div className="route-summary-grid">
            <div><span>Estimated distance</span><strong>{route ? `${distance.toFixed(1)} km` : '—'}</strong></div>
            <div><span>Estimated time</span><strong>{route ? `${Math.max(1, Math.round(duration))} min` : '—'}</strong></div>
          </div>
        </section>
        <div className="map-tip"><p>{pickMode ? `Click the map to choose your ${pickMode} location.` : routeLoading ? 'Calculating the driving route between your selected locations…' : route ? `Route calculated: ${distance.toFixed(1)} km, about ${Math.max(1, Math.round(duration))} minutes. Your estimated fare is ready.` : 'Use Search to choose a suggested address, or select Pick on map and click the map. Once both locations are selected, the driving route, distance, time and fare are calculated automatically.'}</p></div>
      </div>
    </div>
  </>;
}
