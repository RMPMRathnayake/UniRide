import Location from '../models/Location.js';
import { LOCATION_SUGGESTIONS } from '../seedData.js';
import {
  validateCoordinates,
  reverseGeocodeLocation,
  findNearestGazetteerPlace,
  SRI_LANKA_GAZETTEER,
} from '../services/geoUtils.js';

/**
 * GET /api/locations
 * Exported as `getAllLocations`, `getLocations`, `getLocationSuggestions`, and `searchLocations`.
 * Returns all saved/suggested delivery locations (plus optional ?q= search filter).
 */
export async function getAllLocations(req, res) {
  try {
    const query = (req.query.q || req.query.search || '').trim().toLowerCase();
    const dbLocations = await Location.find({}).lean();
    const baseList =
      dbLocations && dbLocations.length > 0 ? dbLocations : LOCATION_SUGGESTIONS;

    // Merge any additional Sri Lanka Gazetteer towns not already in baseList
    const seenIds = new Set(baseList.map((item) => item.id));
    const merged = [...baseList];
    for (const place of SRI_LANKA_GAZETTEER) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        merged.push({
          ...place,
          isGps: false,
        });
      }
    }

    const filtered = query
      ? merged.filter(
          (loc) =>
            loc.title?.toLowerCase().includes(query) ||
            loc.subtitle?.toLowerCase().includes(query) ||
            loc.addressValue?.toLowerCase().includes(query)
        )
      : merged;

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load delivery locations',
      error: error.message,
    });
  }
}

export const getLocations = getAllLocations;
export const getLocationSuggestions = getAllLocations;
export const searchLocations = getAllLocations;

/**
 * GET /api/locations/detect?lat=7.0682&lng=79.9670
 * Exported as `detectLocation`, `detectLocationByGps`, `reverseGeocode`, and `resolveLocation`.
 * Reverse-geocodes the browser's GPS coordinates into a human-readable Sri Lankan
 * town/suburb name (e.g. "Kadawatha, Gampaha") instead of returning raw "GPS (7.0682, 79.9670)".
 */
export async function detectLocation(req, res) {
  const rawLat = req.query.lat ?? req.body?.lat;
  const rawLng = req.query.lng ?? req.body?.lng;

  const coordCheck = validateCoordinates(rawLat, rawLng);
  if (!coordCheck.valid) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COORDINATES',
      message: coordCheck.error,
    });
  }

  const { lat, lng } = coordCheck;

  try {
    const resolved = await reverseGeocodeLocation(lat, lng);

    return res.json({
      success: true,
      data: {
        id: resolved.id || `gps-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        title: resolved.title,
        shortName: resolved.shortName || resolved.title,
        subtitle: `${resolved.subtitle || 'Sri Lanka'} • GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        addressValue: resolved.addressValue || resolved.title,
        lat,
        lng,
        isGps: true,
      },
    });
  } catch (_error) {
    const fallback = findNearestGazetteerPlace(lat, lng);
    return res.json({
      success: true,
      data: {
        id: `gps-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        title: fallback.title,
        shortName: fallback.title,
        subtitle: `${fallback.subtitle} • GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        addressValue: fallback.addressValue,
        lat,
        lng,
        isGps: true,
      },
    });
  }
}

export const detectLocationByGps = detectLocation;
export const reverseGeocode = detectLocation;
export const resolveLocation = detectLocation;

/**
 * GET /api/locations/:id
 */
export async function getLocationById(req, res) {
  try {
    const locId = req.params.id;
    const doc =
      (await Location.findOne({ id: locId }).lean()) ||
      LOCATION_SUGGESTIONS.find((l) => l.id === locId) ||
      SRI_LANKA_GAZETTEER.find((l) => l.id === locId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: `Location ${locId} not found`,
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message,
    });
  }
}

export const getSingleLocation = getLocationById;

/**
 * POST /api/locations
 */
export async function createLocation(req, res) {
  try {
    const payload = req.body || {};
    const locId = payload.id || `loc-${Date.now()}`;
    const doc = await Location.findOneAndUpdate(
      { id: locId },
      { $set: { ...payload, _id: locId, id: locId } },
      { upsert: true, new: true }
    ).lean();

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to save location',
      error: error.message,
    });
  }
}

export const addLocation = createLocation;

export default {
  getAllLocations,
  getLocations,
  getLocationSuggestions,
  searchLocations,
  detectLocation,
  detectLocationByGps,
  reverseGeocode,
  resolveLocation,
  getLocationById,
  getSingleLocation,
  createLocation,
  addLocation,
};
