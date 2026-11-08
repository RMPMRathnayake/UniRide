/**
 * Geographic validation, distance calculation, reverse-geocoding, and spatial bucket utilities.
 *
 * Strictly distinguishes:
 * - Straight-line (geodesic Haversine) distance in meters and km.
 * - Estimated road distance (1.3x winding factor) for delivery fee estimation.
 * - Resolves raw GPS coordinates (e.g. 7.0682, 79.9670) into real Sri Lankan town/area names
 *   so the UI never displays broken "GPS (7.0682" labels.
 */

export const DEFAULT_DISCOVERY_RADIUS_M = Number(
  process.env.DEFAULT_DISCOVERY_RADIUS_M || 2000
);
export const MAX_DISCOVERY_RADIUS_M = Number(
  process.env.MAX_DISCOVERY_RADIUS_M || 10000
);
export const MIN_DISCOVERY_RADIUS_M = 100;
export const MAX_DISCOVERY_RESULTS = Number(
  process.env.MAX_DISCOVERY_RESULTS || 60
);

/**
 * Comprehensive Sri Lankan towns, suburbs, and university campuses gazetteer.
 * Used for instant offline/fallback reverse geocoding when a customer clicks "Allow location access".
 */
export const SRI_LANKA_GAZETTEER = [
  { id: 'kadawatha', title: 'Kadawatha', subtitle: 'Gampaha District, Sri Lanka', addressValue: 'Kadawatha, Gampaha', lat: 7.0682, lng: 79.9670 },
  { id: 'kiribathgoda', title: 'Kiribathgoda', subtitle: 'Kelaniya, Gampaha District', addressValue: 'Kiribathgoda, Kelaniya', lat: 6.9786, lng: 79.9278 },
  { id: 'kelaniya', title: 'University of Kelaniya', subtitle: 'Dalugama, Kelaniya', addressValue: 'Dalugama, Kelaniya', lat: 6.9739, lng: 79.9157 },
  { id: 'gampaha', title: 'Gampaha', subtitle: 'Gampaha Town, Western Province', addressValue: 'Gampaha, Sri Lanka', lat: 7.0873, lng: 79.9990 },
  { id: 'ragama', title: 'Ragama', subtitle: 'Medical Faculty Area, Gampaha', addressValue: 'Ragama, Gampaha', lat: 7.0268, lng: 79.9219 },
  { id: 'wattala', title: 'Wattala', subtitle: 'Western Province, Sri Lanka', addressValue: 'Wattala, Colombo', lat: 6.9892, lng: 79.8917 },
  { id: 'ja-ela', title: 'Ja-Ela', subtitle: 'Gampaha District, Sri Lanka', addressValue: 'Ja-Ela, Gampaha', lat: 7.0744, lng: 79.8919 },
  { id: 'negombo', title: 'Negombo', subtitle: 'Western Province, Sri Lanka', addressValue: 'Negombo, Sri Lanka', lat: 7.2008, lng: 79.8737 },
  { id: 'seusl', title: 'South Eastern University, Oluvil', subtitle: 'Oluvil, Ampara District', addressValue: 'South Eastern University, Oluvil', lat: 7.2974, lng: 81.8504 },
  { id: 'akkaraipattu', title: 'Akkaraipattu', subtitle: 'Ampara District, Sri Lanka', addressValue: 'Akkaraipattu, Ampara', lat: 7.2186, lng: 81.8501 },
  { id: 'kalmunai', title: 'Kalmunai', subtitle: 'Ampara District, Sri Lanka', addressValue: 'Kalmunai, Ampara', lat: 7.4090, lng: 81.8347 },
  { id: 'parakaduwa', title: 'Parakaduwa', subtitle: 'Kuruwita / Eheliyagoda, Sri Lanka', addressValue: 'Parakaduwa, Ratnapura', lat: 6.7625, lng: 80.3285 },
  { id: 'pelawatte', title: 'Pelawatte', subtitle: 'Battaramulla, Colombo', addressValue: 'Pelawatte, Battaramulla', lat: 6.8885, lng: 79.9325 },
  { id: 'malabe', title: 'Malabe', subtitle: 'SLIIT / New Kandy Road, Colombo', addressValue: 'Malabe, Colombo', lat: 6.9147, lng: 79.9729 },
  { id: 'kaduwela', title: 'Kaduwela', subtitle: 'Colombo District, Sri Lanka', addressValue: 'Kaduwela, Colombo', lat: 6.9333, lng: 79.9833 },
  { id: 'homagama', title: 'Homagama', subtitle: 'NSBM Pitipana / High Level Rd', addressValue: 'Homagama, Colombo', lat: 6.8440, lng: 80.0024 },
  { id: 'maharagama', title: 'Maharagama', subtitle: 'High Level Road, Colombo', addressValue: 'Maharagama, Colombo', lat: 6.8480, lng: 79.9265 },
  { id: 'nugegoda', title: 'Nugegoda', subtitle: 'University of Sri Jayewardenepura', addressValue: 'Nugegoda, Colombo', lat: 6.8649, lng: 79.8997 },
  { id: 'dehiwala', title: 'Dehiwala', subtitle: 'Galle Road, Colombo', addressValue: 'Dehiwala, Colombo', lat: 6.8511, lng: 79.8654 },
  { id: 'moratuwa', title: 'Moratuwa', subtitle: 'University of Moratuwa, Katubedda', addressValue: 'Moratuwa, Katubedda', lat: 6.7951, lng: 79.9009 },
  { id: 'panadura', title: 'Panadura', subtitle: 'Kalutara District, Sri Lanka', addressValue: 'Panadura, Sri Lanka', lat: 6.7132, lng: 79.9026 },
  { id: 'colombo', title: 'Colombo 03', subtitle: 'University of Colombo / Kollupitiya', addressValue: 'Colombo 03, Sri Lanka', lat: 6.9022, lng: 79.8612 },
  { id: 'fort', title: 'Colombo Fort', subtitle: 'Colombo 01, Sri Lanka', addressValue: 'Colombo Fort, Colombo', lat: 6.9344, lng: 79.8428 },
  { id: 'ccc', title: 'Colombo City Centre', subtitle: 'Colombo 02, Sri Lanka', addressValue: 'Colombo 02, Sri Lanka', lat: 6.9176, lng: 79.8552 },
  { id: 'peradeniya', title: 'Peradeniya', subtitle: 'University of Peradeniya, Kandy', addressValue: 'Peradeniya, Kandy', lat: 7.2549, lng: 80.5974 },
  { id: 'kandy', title: 'Kandy City', subtitle: 'Central Province, Sri Lanka', addressValue: 'Kandy, Sri Lanka', lat: 7.2906, lng: 80.6337 },
  { id: 'matara', title: 'Matara', subtitle: 'University of Ruhuna, Wellamadama', addressValue: 'Matara, Southern Province', lat: 5.9381, lng: 80.5761 },
  { id: 'galle', title: 'Galle', subtitle: 'Southern Province, Sri Lanka', addressValue: 'Galle, Sri Lanka', lat: 6.0535, lng: 80.2210 },
  { id: 'jaffna', title: 'Jaffna', subtitle: 'University of Jaffna, Thirunelveli', addressValue: 'Jaffna, Northern Province', lat: 9.6848, lng: 80.0220 },
  { id: 'mihintale', title: 'Mihintale', subtitle: 'Rajarata University, Anuradhapura', addressValue: 'Mihintale, Anuradhapura', lat: 8.3592, lng: 80.5035 },
  { id: 'belihuloya', title: 'Belihuloya', subtitle: 'Sabaragamuwa University, Ratnapura', addressValue: 'Belihuloya, Ratnapura', lat: 6.7146, lng: 80.7872 },
  { id: 'kuliyapitiya', title: 'Kuliyapitiya', subtitle: 'Wayamba University, Kurunegala', addressValue: 'Kuliyapitiya, Kurunegala', lat: 7.4688, lng: 80.0401 },
  { id: 'badulla', title: 'Badulla', subtitle: 'Uva Wellassa University', addressValue: 'Badulla, Uva Province', lat: 6.9819, lng: 81.0763 },
];

// In-memory cache for reverse geocoded coordinates
const reverseGeocodeCache = new Map();

/**
 * Validates latitude and longitude values on client or server.
 * Rejects missing, empty, boolean, non-finite (NaN / Infinity), and out-of-range coordinates.
 *
 * @param {unknown} rawLat
 * @param {unknown} rawLng
 * @returns {{ valid: boolean, lat?: number, lng?: number, error?: string }}
 */
export function validateCoordinates(rawLat, rawLng) {
  if (
    rawLat === undefined ||
    rawLat === null ||
    rawLng === undefined ||
    rawLng === null ||
    rawLat === '' ||
    rawLng === '' ||
    typeof rawLat === 'boolean' ||
    typeof rawLng === 'boolean' ||
    Array.isArray(rawLat) ||
    Array.isArray(rawLng)
  ) {
    return {
      valid: false,
      error: 'Both latitude (lat) and longitude (lng) are required numeric values.',
    };
  }

  const strLat = String(rawLat).trim();
  const strLng = String(rawLng).trim();
  if (
    strLat === '' ||
    strLng === '' ||
    strLat.toLowerCase() === 'nan' ||
    strLng.toLowerCase() === 'nan'
  ) {
    return {
      valid: false,
      error: 'Coordinates must be valid numbers and cannot be NaN.',
    };
  }

  const lat = Number(strLat);
  const lng = Number(strLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      valid: false,
      error: 'Latitude and longitude must be finite numbers.',
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: `Latitude ${lat} is out of valid range (-90 to 90).`,
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: `Longitude ${lng} is out of valid range (-180 to 180).`,
    };
  }

  return { valid: true, lat, lng };
}

/**
 * Validates and clamps the requested discovery radius in meters.
 *
 * @param {unknown} rawRadius
 * @returns {{ valid: boolean, radiusMeters?: number, error?: string }}
 */
export function validateRadiusMeters(rawRadius) {
  if (rawRadius === undefined || rawRadius === null || rawRadius === '') {
    return { valid: true, radiusMeters: DEFAULT_DISCOVERY_RADIUS_M };
  }

  const num = Number(rawRadius);
  if (!Number.isFinite(num) || num <= 0) {
    return {
      valid: false,
      error: 'Radius must be a positive finite number in meters.',
    };
  }

  if (num > MAX_DISCOVERY_RADIUS_M) {
    return {
      valid: false,
      error: `Requested radius (${num}m) exceeds maximum allowed radius of ${MAX_DISCOVERY_RADIUS_M}m.`,
    };
  }

  const clamped = Math.max(MIN_DISCOVERY_RADIUS_M, Math.round(num));
  return { valid: true, radiusMeters: clamped };
}

/**
 * Computes the straight-line (great-circle Haversine) distance in meters
 * between two coordinates.
 */
export function calculateStraightLineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns both straight-line distance and estimated road distance (1.3x winding factor),
 * keeping them clearly separated.
 */
export function computeDistanceMetrics(lat1, lng1, lat2, lng2) {
  const straightLineDistanceMeters = calculateStraightLineDistanceMeters(
    lat1,
    lng1,
    lat2,
    lng2
  );
  const straightLineDistanceKm = Number(
    (straightLineDistanceMeters / 1000).toFixed(2)
  );
  const estimatedRoadDistanceKm = Number(
    ((straightLineDistanceMeters / 1000) * 1.3).toFixed(2)
  );

  return {
    straightLineDistanceMeters,
    straightLineDistanceKm,
    estimatedRoadDistanceKm,
    distanceBasis: 'straight_line_haversine',
  };
}

/**
 * Computes a geographic bucket (~1.1 km grid resolution at 0.01 deg) that
 * fetches a radius large enough to completely cover the user's exact search circle.
 */
export function computeCoveringBucket(lat, lng, requestedRadiusMeters) {
  // Snap to 0.01 degree grid (~1.11 km)
  const centerLat = Number((Math.round(lat * 100) / 100).toFixed(4));
  const centerLng = Number((Math.round(lng * 100) / 100).toFixed(4));

  const offsetMeters = calculateStraightLineDistanceMeters(
    lat,
    lng,
    centerLat,
    centerLng
  );

  // Ensure the Overpass query around (centerLat, centerLng) completely covers
  // the user's circle of `requestedRadiusMeters` around (lat, lng).
  const requiredCoverageMeters = requestedRadiusMeters + offsetMeters + 250;
  const fetchRadiusMeters = Math.min(
    MAX_DISCOVERY_RADIUS_M + 1500,
    Math.ceil(requiredCoverageMeters / 500) * 500
  );

  const bucketKey = `grid:${centerLat.toFixed(2)}:${centerLng.toFixed(2)}:r${fetchRadiusMeters}`;

  return {
    bucketKey,
    centerLat,
    centerLng,
    offsetMeters,
    fetchRadiusMeters,
  };
}

/**
 * Finds the closest known Sri Lankan town/university from SRI_LANKA_GAZETTEER.
 * Guaranteed synchronous fallback so raw "GPS (7.0682, 79.9670)" is never used as a city name.
 */
export function findNearestGazetteerPlace(lat, lng) {
  let nearest = SRI_LANKA_GAZETTEER[0];
  let minMeters = Infinity;

  for (const place of SRI_LANKA_GAZETTEER) {
    const meters = calculateStraightLineDistanceMeters(
      lat,
      lng,
      place.lat,
      place.lng
    );
    if (meters < minMeters) {
      minMeters = meters;
      nearest = place;
    }
  }

  return {
    ...nearest,
    distanceMeters: minMeters,
    distanceKm: Number((minMeters / 1000).toFixed(2)),
  };
}

/**
 * Cleans any location string that might contain raw "GPS (7.0682, 79.9670)"
 * and returns a human-readable town/suburb name (e.g., "Kadawatha").
 * Fixes the bug where `location.split(',')[0]` produced "Pizza Hut - GPS (7.0682".
 */
export function cleanLocationAreaLabel(rawLocation = '', lat = null, lng = null) {
  const str = String(rawLocation || '').trim();

  // Check if rawLocation is of the form "GPS (7.0682, 79.9670)" or "(7.0682, 79.9670)"
  const gpsMatch = str.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (gpsMatch) {
    const parsedLat = Number(gpsMatch[1]);
    const parsedLng = Number(gpsMatch[2]);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      const nearest = findNearestGazetteerPlace(parsedLat, parsedLng);
      return {
        shortName: nearest.title,
        fullAddress: nearest.addressValue,
        subtitle: nearest.subtitle,
        lat: parsedLat,
        lng: parsedLng,
      };
    }
  }

  // If valid lat/lng were passed alongside an empty or generic "GPS" string
  if (
    (!str || str.toLowerCase().startsWith('gps') || str.toLowerCase() === 'current location') &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  ) {
    const nearest = findNearestGazetteerPlace(Number(lat), Number(lng));
    return {
      shortName: nearest.title,
      fullAddress: nearest.addressValue,
      subtitle: nearest.subtitle,
      lat: Number(lat),
      lng: Number(lng),
    };
  }

  if (str) {
    const cleanShort = str.split(',')[0].replace(/^GPS\s*\(?/i, '').trim() || 'Campus Area';
    return {
      shortName: cleanShort,
      fullAddress: str,
      subtitle: 'Sri Lanka',
      lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
      lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    };
  }

  return {
    shortName: 'Kadawatha',
    fullAddress: 'Kadawatha, Gampaha',
    subtitle: 'Gampaha District, Sri Lanka',
    lat: 7.0682,
    lng: 79.9670,
  };
}

/**
 * Reverse-geocodes (lat, lng) into a real street/suburb/town name using
 * OpenStreetMap Nominatim + BigDataCloud with a fast timeout and automatic fallback
 * to `findNearestGazetteerPlace(lat, lng)`.
 */
export async function reverseGeocodeLocation(lat, lng) {
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  const nearest = findNearestGazetteerPlace(lat, lng);

  // If within 2.5 km of an exact gazetteer landmark (like SEUSL Oluvil or Kadawatha),
  // prepare a clean default immediately
  const defaultResolved = {
    id: `loc-${cacheKey}`,
    title: nearest.title,
    shortName: nearest.title,
    subtitle: nearest.subtitle,
    addressValue: nearest.addressValue,
    lat: Number(lat),
    lng: Number(lng),
    isGps: true,
    distanceFromLandmarkMeters: nearest.distanceMeters,
  };

  // Try OpenStreetMap Nominatim Reverse Geocoding (with 2.8s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'UniEats-CampusConcierge/1.0 (SriLanka-Student-Project)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const addr = data?.address || {};
      const locality =
        addr.suburb ||
        addr.town ||
        addr.village ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.city ||
        addr.municipality ||
        '';
      const district =
        addr.state_district || addr.county || addr.city || addr.state || 'Sri Lanka';

      if (locality) {
        const cleanTitle = locality.replace(/\s+Division$/i, '').trim();
        const addressValue =
          district && district !== cleanTitle
            ? `${cleanTitle}, ${district}`
            : cleanTitle;
        const resolved = {
          id: `gps-${cacheKey}`,
          title: cleanTitle,
          shortName: cleanTitle,
          subtitle: `${district}, Sri Lanka`,
          addressValue,
          lat: Number(lat),
          lng: Number(lng),
          isGps: true,
        };
        reverseGeocodeCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch {
    // Fall through to BigDataCloud / Gazetteer fallback
  }

  // Try BigDataCloud Free Reverse Geocoder (with 2.5s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const rawLocality = data?.locality || data?.city || '';
      const subdivision = data?.principalSubdivision || 'Sri Lanka';
      if (rawLocality && !rawLocality.toLowerCase().includes('unknown')) {
        const cleanTitle = rawLocality.replace(/\s+Division$/i, '').trim();
        const addressValue =
          subdivision && subdivision !== cleanTitle
            ? `${cleanTitle}, ${subdivision}`
            : cleanTitle;
        const resolved = {
          id: `gps-${cacheKey}`,
          title: cleanTitle,
          shortName: cleanTitle,
          subtitle: `${subdivision}, Sri Lanka`,
          addressValue,
          lat: Number(lat),
          lng: Number(lng),
          isGps: true,
        };
        reverseGeocodeCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch {
    // Fall back to nearest Sri Lankan Gazetteer town
  }

  reverseGeocodeCache.set(cacheKey, defaultResolved);
  return defaultResolved;
}