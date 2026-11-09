const placeCache = new Map();
let geocodingQueue = Promise.resolve();
let lastGeocodingStart = 0;

async function waitForGeocodingSlot() {
  const previous = geocodingQueue;
  let release;
  geocodingQueue = new Promise((resolve) => { release = resolve; });
  await previous;
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodingStart));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastGeocodingStart = Date.now();
  release();
}

export async function searchPlaces(req, res) {
  const query = String(req.query.q || '').trim();
  if (query.length < 3 || query.length > 180) return res.status(400).json({ message: 'Enter a location between 3 and 180 characters.' });
  const cacheKey = query.toLocaleLowerCase();
  const cached = placeCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000) return res.json({ results: cached.results, cached: true });
  try {
    await waitForGeocodingSlot();
    const params = new URLSearchParams({ format: 'jsonv2', limit: '5', addressdetails: '1', q: query });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'WaygoRiderDashboard/1.0',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({ message: 'OpenStreetMap location search is temporarily unavailable.' });
    const data = await response.json();
    const results = data.map((item) => ({ address: item.display_name, coordinates: [Number(item.lon), Number(item.lat)] })).filter((item) => item.coordinates.every(Number.isFinite));
    placeCache.set(cacheKey, { results, savedAt: Date.now() });
    if (placeCache.size > 500) placeCache.delete(placeCache.keys().next().value);
    res.json({ results, cached: false });
  } catch {
    res.status(502).json({ message: 'Could not reach OpenStreetMap location search. Please try again.' });
  }
}


export async function reversePlace(req, res) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ message: 'A valid latitude and longitude are required.' });
  }
  const cacheKey = `reverse:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  const cached = placeCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000) {
    return res.json({ place: cached.results[0], cached: true });
  }
  try {
    await waitForGeocodingSlot();
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), zoom: '18', addressdetails: '1' });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'WaygoRiderDashboard/1.0',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({ message: 'OpenStreetMap address lookup is temporarily unavailable.' });
    const item = await response.json();
    const place = item?.display_name ? { address: item.display_name, coordinates: [lon, lat] } : null;
    if (!place) return res.status(404).json({ message: 'No address was found at that map location.' });
    placeCache.set(cacheKey, { results: [place], savedAt: Date.now() });
    if (placeCache.size > 500) placeCache.delete(placeCache.keys().next().value);
    return res.json({ place, cached: false });
  } catch {
    return res.status(502).json({ message: 'Could not reach OpenStreetMap address lookup. Please try again.' });
  }
}


const routeCache = new Map();
function validCoordinate(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

export async function drivingRoute(req, res) {
  const startLat = validCoordinate(req.query.startLat, -90, 90);
  const startLng = validCoordinate(req.query.startLng, -180, 180);
  const endLat = validCoordinate(req.query.endLat, -90, 90);
  const endLng = validCoordinate(req.query.endLng, -180, 180);
  if ([startLat, startLng, endLat, endLng].some((value) => value === null)) {
    return res.status(400).json({ message: 'Valid pickup and destination coordinates are required.' });
  }

  const cacheKey = `${startLat.toFixed(5)},${startLng.toFixed(5)}:${endLat.toFixed(5)},${endLng.toFixed(5)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) {
    return res.json({ ...cached.result, cached: true });
  }

  const osrmBase = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const routeUrl = `${osrmBase}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=simplified&geometries=geojson&steps=false&alternatives=false`;
  try {
    const response = await fetch(routeUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Routing service returned HTTP ${response.status}.`);
    const data = await response.json();
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      return res.status(404).json({ message: 'No driving route found. Try different pickup and destination locations.' });
    }
    const result = {
      distanceMeters: Number(route.distance || 0),
      durationSeconds: Number(route.duration || 0),
      coordinates: route.geometry.coordinates
    };
    routeCache.set(cacheKey, { result, savedAt: Date.now() });
    if (routeCache.size > 500) routeCache.delete(routeCache.keys().next().value);
    res.set('Cache-Control', 'private, max-age=600');
    return res.json(result);
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Could not calculate the driving route. Please try again.' });
  }
}
