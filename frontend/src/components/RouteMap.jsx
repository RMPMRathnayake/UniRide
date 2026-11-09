import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import api from '../services/api';

const OSM_TILE_URL = import.meta.env.VITE_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DEFAULT_COORDS = [81.856875, 7.300617];

export async function getRoadRoute(origin, destination, signal) {
  const [lng1, lat1] = origin.coordinates;
  const [lng2, lat2] = destination.coordinates;
  const { data } = await api.get('/geocoding/route', { params: { startLat: lat1, startLng: lng1, endLat: lat2, endLng: lng2 }, signal, timeout: 10000 });
  if (!Array.isArray(data.coordinates) || data.coordinates.length < 2) throw new Error(data.message || 'No driving route found');
  return {
    points: data.coordinates.map(([lng, lat]) => [Number(lat), Number(lng)]),
    distanceKm: Number(data.distanceMeters) / 1000,
    durationMin: Number(data.durationSeconds) / 60
  };
}
function MapViewport({ points, center }) {
  const map = useMap();
  useEffect(() => {
    if (points?.length > 1) map.fitBounds(points, { padding: [24, 24], maxZoom: 16 });
    else if (center?.length === 2) map.setView(center, 15);
  }, [map, points, center?.[0], center?.[1]]);
  return null;
}
function MapClickPicker({ active, onPick }) {
  useMapEvents({ click(event) { if (active) onPick?.({ lat: event.latlng.lat, lng: event.latlng.lng }); } });
  return null;
}
export default function RouteMap({ origin, destination, height = 270, onRoute, compact = false, calculateRoute = true, routeRequestId = 0, pickMode = '', onMapPick, onRouteLoading }) {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeMeta, setRouteMeta] = useState(null);
  const [warning, setWarning] = useState('');
  const hasOrigin = Boolean(origin?.coordinates?.length === 2);
  const hasDestination = Boolean(destination?.coordinates?.length === 2);
  const valid = hasOrigin && hasDestination;
  useEffect(() => {
    const controller = new AbortController();
    if (!valid || !calculateRoute) {
      setRoutePoints([]); setRouteMeta(null); setWarning(''); onRoute?.(null); onRouteLoading?.(false);
      return () => controller.abort();
    }
    setRoutePoints([]); setRouteMeta(null); setWarning(''); onRouteLoading?.(true);
    getRoadRoute(origin, destination, controller.signal).then((route) => {
      setRoutePoints(route.points); setRouteMeta(route); onRoute?.(route);
    }).catch((error) => {
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED' && !controller.signal.aborted) {
        setWarning(error.response?.data?.message || error.message || 'Road route is unavailable. Please try selecting the locations again.'); onRoute?.(null);
      }
    }).finally(() => { if (!controller.signal.aborted) onRouteLoading?.(false); });
    return () => controller.abort();
  }, [valid, calculateRoute, routeRequestId, origin?.coordinates?.[0], origin?.coordinates?.[1], destination?.coordinates?.[0], destination?.coordinates?.[1]]);

  const fallbackPoints = useMemo(() => valid ? [[origin.coordinates[1], origin.coordinates[0]], [destination.coordinates[1], destination.coordinates[0]]] : [], [valid, origin?.coordinates?.[0], origin?.coordinates?.[1], destination?.coordinates?.[0], destination?.coordinates?.[1]]);
  const bounds = routePoints.length > 1 ? routePoints : fallbackPoints;
  const center = valid
    ? [(origin.coordinates[1] + destination.coordinates[1]) / 2, (origin.coordinates[0] + destination.coordinates[0]) / 2]
    : hasOrigin ? [origin.coordinates[1], origin.coordinates[0]]
      : hasDestination ? [destination.coordinates[1], destination.coordinates[0]]
        : [DEFAULT_COORDS[1], DEFAULT_COORDS[0]];
  return <div className={`route-map-wrap ${compact ? 'route-map-compact' : ''} ${pickMode ? 'route-map-pick-active' : ''}`}>
    <div className="map-meta"><span>{valid && routeMeta ? 'CALCULATED ROAD ROUTE' : 'MAP PREVIEW'}</span>{routeMeta && <strong>{routeMeta.distanceKm.toFixed(1)} km <i>·</i> {Math.max(1, Math.round(routeMeta.durationMin))} min</strong>}</div>
    {pickMode && <div className="map-pick-banner">Click anywhere on the map to choose your {pickMode} location.</div>}
    <MapContainer center={center} zoom={valid ? 14 : 15} scrollWheelZoom={false} preferCanvas={true} style={{ height, width: '100%' }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={OSM_TILE_URL} />
      {pickMode && <MapClickPicker active={Boolean(pickMode)} onPick={onMapPick} />}
      {valid && routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: '#0071e3', weight: 6, opacity: .92, lineCap: 'round', lineJoin: 'round' }} />}
      {hasOrigin && <CircleMarker center={[origin.coordinates[1], origin.coordinates[0]]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#16a779', fillOpacity: 1 }}><Popup><strong>Pickup</strong><br />{origin.address}</Popup></CircleMarker>}
      {hasDestination && <CircleMarker center={[destination.coordinates[1], destination.coordinates[0]]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#ed8b52', fillOpacity: 1 }}><Popup><strong>Destination</strong><br />{destination.address}</Popup></CircleMarker>}
      <MapViewport points={valid ? bounds : []} center={center} />
    </MapContainer>
    {warning && <div className="map-warning">{warning}</div>}
  </div>;
}
