import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { Navigation, Route as RouteIcon } from './Icon';

const OSRM_BASE = (import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const OSM_TILE_URL = import.meta.env.VITE_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points?.length >= 2) map.fitBounds(points, { padding: [34, 34], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export default function RouteMap({ origin, destination, height = 255 }) {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeMeta, setRouteMeta] = useState(null);
  const [routeWarning, setRouteWarning] = useState('');
  const originCoord = origin?.coordinates;
  const destinationCoord = destination?.coordinates;
  const valid = Array.isArray(originCoord) && originCoord.length === 2 && Array.isArray(destinationCoord) && destinationCoord.length === 2;

  useEffect(() => {
    let cancelled = false;
    if (!valid) { setRoutePoints([]); setRouteMeta(null); return undefined; }
    setRouteWarning('');
    setRouteMeta(null);
    const fallback = [[originCoord[1], originCoord[0]], [destinationCoord[1], destinationCoord[0]]];
    setRoutePoints(fallback);

    const url = `${OSRM_BASE}/route/v1/driving/${originCoord[0]},${originCoord[1]};${destinationCoord[0]},${destinationCoord[1]}?overview=full&geometries=geojson&steps=false`;
    fetch(url)
      .then((response) => { if (!response.ok) throw new Error('Routing service unavailable'); return response.json(); })
      .then((data) => {
        if (cancelled) return;
        const route = data.routes?.[0];
        if (!route || data.code !== 'Ok') throw new Error('No driving route found');
        setRoutePoints(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        setRouteMeta({ distance: route.distance / 1000, duration: route.duration / 60 });
      })
      .catch(() => {
        if (!cancelled) setRouteWarning('Road route unavailable. Showing a direct route preview instead.');
      });

    return () => { cancelled = true; };
  }, [valid, originCoord?.[0], originCoord?.[1], destinationCoord?.[0], destinationCoord?.[1]]);

  const center = useMemo(() => valid ? [(originCoord[1] + destinationCoord[1]) / 2, (originCoord[0] + destinationCoord[0]) / 2] : [38.8977, -77.0365], [valid, originCoord?.[0], originCoord?.[1], destinationCoord?.[0], destinationCoord?.[1]]);

  if (!valid) return <div className="map-placeholder" style={{ height }}><Navigation size={24} /><span>Route coordinates are not available for this job.</span></div>;

  return (
    <div className="route-map-wrap">
      <div className="map-meta"><span><RouteIcon size={14} /> ROUTE PREVIEW</span>{routeMeta && <strong>{routeMeta.distance.toFixed(1)} km <i>·</i> {Math.max(1, Math.round(routeMeta.duration))} min</strong>}</div>
      <MapContainer key={`${originCoord.join(',')}-${destinationCoord.join(',')}`} center={center} zoom={13} scrollWheelZoom={false} preferCanvas={true} style={{ height, width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={OSM_TILE_URL} />
        {routePoints.length > 1 && <><Polyline positions={routePoints} pathOptions={{ color: '#0071e3', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} /><Polyline positions={routePoints} pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.75, dashArray: '4 10' }} /></>}
        <CircleMarker center={[originCoord[1], originCoord[0]]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#16a779', fillOpacity: 1 }}><Popup><strong>Pickup</strong><br />{origin.address}</Popup></CircleMarker>
        <CircleMarker center={[destinationCoord[1], destinationCoord[0]]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#ed8b52', fillOpacity: 1 }}><Popup><strong>Destination</strong><br />{destination.address}</Popup></CircleMarker>
        <FitBounds points={routePoints.length ? routePoints : [[originCoord[1], originCoord[0]], [destinationCoord[1], destinationCoord[0]]]} />
      </MapContainer>
      {routeWarning && <div className="map-warning">{routeWarning}</div>}
    </div>
  );
}
