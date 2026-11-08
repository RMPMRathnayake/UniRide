/**
 * Deterministic Overpass API Fixtures around South Eastern University of Sri Lanka (SEUSL, Oluvil)
 * Coordinates: ~7.2975 N, 81.8505 E
 *
 * Includes:
 * - OSM node (with direct lat/lon)
 * - OSM way (with approximate `center` coordinates)
 * - OSM relation (with approximate `center` coordinates)
 * - Pharmacy (discoverable place, no medicine catalog)
 * - Unnamed element (should be filtered out cleanly)
 */

export const SEUSL_COORDS = {
  lat: 7.2975,
  lng: 81.8505,
};

export const OVERPASS_SEUSL_FIXTURE = {
  version: 0.6,
  generator: 'Overpass API Fixture for SEUSL Oluvil',
  elements: [
    // 1. OSM Node: Bookshop & Stationery near SEUSL Main Gate
    {
      type: 'node',
      id: 9001001,
      lat: 7.2982,
      lon: 81.8512,
      tags: {
        name: 'Oluvil Campus Bookshop & Stationery',
        'name:en': 'Oluvil Campus Bookshop',
        'name:ta': 'ஒலுவில் புத்தக நிலையம்',
        shop: 'stationery',
        'addr:street': 'Main University Road',
        'addr:city': 'Oluvil',
        'addr:postcode': '32360',
        opening_hours: 'Mo-Sa 08:00-20:00',
        phone: '+94 67 225 5101',
      },
    },
    // 2. OSM Way: Supermarket building footprint with `center` coordinates
    {
      type: 'way',
      id: 9002002,
      center: {
        lat: 7.301,
        lon: 81.8535,
      },
      tags: {
        name: 'Kalmunai Cooperative Mini Mart - Oluvil',
        shop: 'supermarket',
        'addr:city': 'Oluvil',
        // Notice: no phone or opening_hours tag -> must remain null, never invented
      },
    },
    // 3. OSM Relation: Restaurant complex with `center` coordinates
    {
      type: 'relation',
      id: 9003003,
      center: {
        lat: 7.296,
        lon: 81.849,
      },
      tags: {
        name: 'Al-Aqsa Student Restaurant & Bake House',
        amenity: 'restaurant',
        cuisine: 'sri_lankan;rice_and_curry;kottu',
        'addr:street': 'Beach Road, Oluvil',
      },
    },
    // 4. OSM Node: Pharmacy (discoverable place; must not generate medicine catalog)
    {
      type: 'node',
      id: 9004004,
      lat: 7.2995,
      lon: 81.852,
      tags: {
        name: 'Lanka Care Pharmacy Oluvil',
        amenity: 'pharmacy',
        opening_hours: '08:00-22:00',
      },
    },
    // 5. Unnamed node (must be ignored by normalizer)
    {
      type: 'node',
      id: 9005005,
      lat: 7.2977,
      lon: 81.8507,
      tags: {
        shop: 'convenience',
      },
    },
  ],
};

// Minimal valid 1x1 PNG image in base64 (starts with 89 50 4E 47 0D 0A 1A 0A)
export const VALID_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
