/**
 * OpenStreetMap Overpass API Provider
 *
 * Queries nodes, ways, and relations (`nwr`) around a coordinate & radius,
 * normalizes OSM elements into our GeoJSON shop structure, and enforces:
 * - Configurable endpoint via OVERPASS_API_URL
 * - Bounded request timeout via AbortController
 * - Limited retries with exponential backoff for transient 5xx/network errors
 * - Strict respect for HTTP 429 rate-limit responses (cooldown tracking)
 * - Pluggable fetch adapter so automated tests never depend on live Overpass
 */

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

// Cooldown timestamp if Overpass returns HTTP 429 Too Many Requests
let rateLimitCooldownUntil = 0;

// Pluggable fetch implementation for unit/integration testing
let customFetchAdapter = null;

export function setOverpassFetchAdapter(fn) {
  customFetchAdapter = fn;
}

export function isUsingCustomOverpassAdapter() {
  return typeof customFetchAdapter === 'function';
}

export function resetOverpassCooldown() {
  rateLimitCooldownUntil = 0;
}

/**
 * Builds an Overpass QL query for nodes, ways, and relations (`nwr`) matching
 * student-relevant nearby shop categories around (lat, lng) within radiusMeters.
 */
export function buildOverpassQuery(lat, lng, radiusMeters) {
  const timeoutSec = Math.max(
    5,
    Math.ceil(Number(process.env.OVERPASS_TIMEOUT_MS || 8000) / 1000)
  );
  const r = Math.round(radiusMeters);

  return `
[out:json][timeout:${timeoutSec}];
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|pharmacy)$"](around:${r},${lat},${lng});
  nwr["shop"~"^(supermarket|convenience|grocery|greengrocer|general|bakery|pastry|books|stationery|copyshop|newsagent|chemist|department_store|mall|butcher|seafood|Beverages|beverages|confectionery|variety_store)$"](around:${r},${lat},${lng});
);
out center tags;
`.trim();
}

/**
 * Maps raw OSM tags to one of our four canonical concierge categories:
 * 'food' | 'grocery' | 'stationery' | 'pharmacy'
 */
export function classifyOsmCategory(tags = {}) {
  const amenity = (tags.amenity || '').toLowerCase();
  const shop = (tags.shop || '').toLowerCase();

  if (
    amenity === 'pharmacy' ||
    shop === 'chemist' ||
    shop === 'pharmacy' ||
    shop === 'medical_supply'
  ) {
    return {
      category: 'pharmacy',
      osmSubcategory: amenity || shop || 'pharmacy',
    };
  }

  if (['books', 'stationery', 'copyshop', 'newsagent'].includes(shop)) {
    return { category: 'stationery', osmSubcategory: shop };
  }

  if (
    [
      'supermarket',
      'convenience',
      'grocery',
      'greengrocer',
      'general',
      'department_store',
      'mall',
      'butcher',
      'seafood',
      'beverages',
      'variety_store',
    ].includes(shop)
  ) {
    return { category: 'grocery', osmSubcategory: shop };
  }

  if (
    ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream'].includes(
      amenity
    ) ||
    ['bakery', 'pastry', 'confectionery'].includes(shop)
  ) {
    return {
      category: 'food',
      osmSubcategory: amenity || shop || 'restaurant',
    };
  }

  return null;
}

/**
 * Normalizes a single Overpass element (node, way, or relation) into our
 * consistent DiscoveredShop structure.
 * Returns null if the element lacks valid coordinates, a category, or a name.
 */
export function normalizeOsmElement(el, fetchedAt = new Date()) {
  if (!el || typeof el !== 'object') return null;

  const osmType = el.type;
  if (!['node', 'way', 'relation'].includes(osmType)) return null;
  if (el.id === undefined || el.id === null) return null;

  const tags = el.tags || {};
  const classification = classifyOsmCategory(tags);
  if (!classification) return null;

  // Extract name (do not invent names for unnamed geometry)
  const primaryName = (
    tags.name ||
    tags['name:en'] ||
    tags['name:si'] ||
    tags['name:ta'] ||
    tags.brand ||
    tags.operator ||
    ''
  ).trim();

  if (!primaryName) return null;

  // Extract coordinates: direct (lat, lon) for nodes, `center` for ways and relations
  let lat = null;
  let lon = null;
  let locationAccuracy = 'node';
  let coordinatesApprox = false;

  if (osmType === 'node') {
    lat = Number(el.lat);
    lon = Number(el.lon);
    locationAccuracy = 'node';
    coordinatesApprox = false;
  } else if (el.center && typeof el.center === 'object') {
    lat = Number(el.center.lat);
    lon = Number(el.center.lon);
    locationAccuracy = 'approximate_center';
    coordinatesApprox = true;
  }

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  // Collect alternative names
  const altSet = new Set();
  for (const key of [
    'name:en',
    'name:si',
    'name:ta',
    'alt_name',
    'old_name',
    'brand',
  ]) {
    if (tags[key] && tags[key].trim() && tags[key].trim() !== primaryName) {
      altSet.add(tags[key].trim());
    }
  }

  // Extract address ONLY from present OSM tags (never invent missing address fields)
  const houseNumber = tags['addr:housenumber']?.trim() || null;
  const street = tags['addr:street']?.trim() || null;
  const city =
    tags['addr:city']?.trim() ||
    tags['addr:town']?.trim() ||
    tags['addr:Suburb']?.trim() ||
    tags['addr:place']?.trim() ||
    null;
  const postcode = tags['addr:postcode']?.trim() || null;
  const fullAddr = tags['addr:full']?.trim() || null;

  const addrParts = [houseNumber, street, city, postcode].filter(Boolean);
  const formattedAddress =
    fullAddr || (addrParts.length > 0 ? addrParts.join(', ') : null);

  // Extract contact details ONLY when present in OSM tags (never invent phone numbers)
  const phone =
    tags.phone?.trim() ||
    tags['contact:phone']?.trim() ||
    tags['phone:mobile']?.trim() ||
    null;
  const website =
    tags.website?.trim() || tags['contact:website']?.trim() || null;
  const email = tags.email?.trim() || tags['contact:email']?.trim() || null;

  const openingHours = tags.opening_hours?.trim() || null;
  const externalId = `osm:${osmType}:${el.id}`;

  return {
    _id: externalId,
    externalId,
    osmType,
    osmId: String(el.id),
    name: primaryName,
    altNames: Array.from(altSet),
    category: classification.category,
    osmSubcategory: classification.osmSubcategory,
    location: {
      type: 'Point',
      coordinates: [lon, lat], // GeoJSON: [longitude, latitude]
    },
    locationAccuracy,
    coordinatesApprox,
    address: {
      houseNumber,
      street,
      city,
      postcode,
      formatted: formattedAddress,
    },
    contact: {
      phone,
      website,
      email,
    },
    openingHours,
    source: 'openstreetmap_overpass',
    attribution: '© OpenStreetMap contributors',
    attributionUrl: 'https://www.openstreetmap.org/copyright',
    storeType: 'independent_osm',
    isIndependent: true,
    conciergeNotice:
      'An independent rider shops here on your behalf. Prices and availability are confirmed before purchase.',
    rawOsmTags: tags,
    fetchedAt,
  };
}

/**
 * Executes an Overpass query with bounded timeout, retry backoff, and 429 protection.
 */
export async function fetchOverpassShops(lat, lng, radiusMeters) {
  const now = Date.now();
  if (now < rateLimitCooldownUntil) {
    const err = new Error(
      'Overpass discovery provider is cooling down after HTTP 429 rate limit.'
    );
    err.code = 'OVERPASS_RATE_LIMITED';
    err.status = 429;
    throw err;
  }

  const defaultTimeout = Number(process.env.OVERPASS_TIMEOUT_MS || 8000);
  const maxRetries = Number(process.env.OVERPASS_MAX_RETRIES ?? 2);
  const query = buildOverpassQuery(lat, lng, radiusMeters);
  const fetchFn = customFetchAdapter || globalThis.fetch;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const endpoint =
      process.env.OVERPASS_API_URL ||
      OVERPASS_MIRRORS[attempt % OVERPASS_MIRRORS.length];
    const timeoutMs = defaultTimeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'UniEats-CampusConcierge/1.0 (SEUSL-Student-Project)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 429) {
        const retryAfterHeader = response.headers?.get?.('retry-after');
        const retrySec = Number(retryAfterHeader);
        const cooldownMs =
          Number.isFinite(retrySec) && retrySec > 0
            ? Math.min(retrySec * 1000, 60000)
            : 15000;
        rateLimitCooldownUntil = Date.now() + cooldownMs;

        const err = new Error('Overpass API rate limit reached (HTTP 429).');
        err.code = 'OVERPASS_RATE_LIMITED';
        err.status = 429;
        throw err; // Do not retry immediately on 429
      }

      if (!response.ok) {
        const err = new Error(
          `Overpass API returned HTTP ${response.status}`
        );
        err.code = 'OVERPASS_HTTP_ERROR';
        err.status = response.status;
        // Only retry on transient server errors (502, 503, 504)
        if (![502, 503, 504].includes(response.status)) {
          throw err;
        }
        lastError = err;
      } else {
        let payload;
        try {
          payload = await response.json();
        } catch {
          const err = new Error('Overpass API returned malformed JSON.');
          err.code = 'OVERPASS_MALFORMED_RESPONSE';
          throw err;
        }

        if (!payload || !Array.isArray(payload.elements)) {
          const err = new Error(
            'Overpass API response is incomplete (missing elements array).'
          );
          err.code = 'OVERPASS_INCOMPLETE_RESPONSE';
          throw err;
        }

        const fetchedAt = new Date();
        const normalized = [];
        const seenIds = new Set();

        for (const el of payload.elements) {
          const norm = normalizeOsmElement(el, fetchedAt);
          if (norm && !seenIds.has(norm.externalId)) {
            seenIds.add(norm.externalId);
            normalized.push(norm);
          }
        }

        return {
          shops: normalized,
          fetchedAt,
        };
      }
    } catch (error) {
      clearTimeout(timer);

      if (error.name === 'AbortError') {
        const timeoutErr = new Error(
          `Overpass request timed out after ${timeoutMs}ms.`
        );
        timeoutErr.code = 'OVERPASS_TIMEOUT';
        lastError = timeoutErr;
      } else if (
        error.code === 'OVERPASS_RATE_LIMITED' ||
        error.code === 'OVERPASS_MALFORMED_RESPONSE' ||
        error.code === 'OVERPASS_INCOMPLETE_RESPONSE'
      ) {
        throw error;
      } else {
        lastError = error;
      }
    }

    // Exponential backoff before next retry if attempts remain
    if (attempt < maxRetries) {
      const backoffMs = Math.min(300 * Math.pow(2, attempt), 1500);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw (
    lastError || new Error('Shop discovery provider is temporarily unavailable.')
  );
}