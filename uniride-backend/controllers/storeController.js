import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Rider from '../models/Rider.js';
import Location from '../models/Location.js';
import {
  ALL_STORES,
  CATEGORY_PRODUCT_TEMPLATES,
  SIDEBAR_CATEGORIES,
  TOP_ICON_CATEGORIES,
  FEATURED_ADS,
  UNIRIDE_RIDERS,
  HELP_CENTER_TOPICS,
  LOCATION_SUGGESTIONS,
  calculateRoadDistanceKm,
  calculateDynamicEtaMins,
} from '../seedData.js';
import { cleanLocationAreaLabel } from '../services/geoUtils.js';

/**
 * Helper to enrich a raw store document with customer-relative coordinates,
 * road distance, dynamic ETA, localized store title, and catalog products.
 */
function enrichStoreForCustomer(store, areaInfo, productsByStoreId) {
  const catalogStore = ALL_STORES.find((item) => item.id === store.id);
  const customerLat = Number.isFinite(Number(areaInfo.lat))
    ? Number(areaInfo.lat)
    : 7.0682;
  const customerLng = Number.isFinite(Number(areaInfo.lng))
    ? Number(areaInfo.lng)
    : 79.9670;

  const dLat = store.location?.dLat ?? store.dLat ?? 0.008;
  const dLng = store.location?.dLng ?? store.dLng ?? 0.006;

  const storeLat = Number((customerLat + dLat).toFixed(5));
  const storeLng = Number((customerLng + dLng).toFixed(5));

  const distanceKm = calculateRoadDistanceKm(
    customerLat,
    customerLng,
    storeLat,
    storeLng
  );
  const etaMins = calculateDynamicEtaMins(distanceKm, 10, 3);

  const shortArea = areaInfo.shortName || 'Campus Area';
  const baseName = store.name.replace(/\s*[-·]\s*.*$/, '').trim();
  const localizedName = baseName.toLowerCase().includes(shortArea.toLowerCase())
    ? baseName
    : `${baseName} · ${shortArea}`;

  const storeProducts = productsByStoreId.get(store.id) || [];

  return {
    ...store,
    id: store.id || store._id,
    logoImg: store.logoImg || catalogStore?.logoImg || '',
    bannerImg: store.bannerImg || catalogStore?.bannerImg || '',
    baseName,
    name: localizedName,
    displayName: localizedName,
    areaName: shortArea,
    deliveryArea: areaInfo.fullAddress,
    lat: storeLat,
    lng: storeLng,
    distanceKm,
    eta: `${etaMins} min`,
    etaMins,
    products: storeProducts,
  };
}

/**
 * GET /api/meta
 * Returns UI metadata, sidebar categories, top icons, featured partner ads,
 * riders, locations, and help topics localized to the customer's active area.
 */
export async function getAppMeta(req, res) {
  try {
    const areaInfo = cleanLocationAreaLabel(
      req.query.location,
      req.query.lat,
      req.query.lng
    );

    const [dbRiders, dbLocations] = await Promise.all([
      Rider.find({}).lean().catch(() => []),
      Location.find({}).lean().catch(() => []),
    ]);

    const localizedFeaturedAds = FEATURED_ADS.map((ad) => {
      const cleanBase = ad.name
        .replace(/\s+Battaramulla$/i, '')
        .replace(/\s*[-·]\s*.*$/, '')
        .trim();
      return {
        ...ad,
        baseName: cleanBase,
        name: `${cleanBase} – ${areaInfo.shortName}`,
        areaName: areaInfo.shortName,
      };
    });

    return res.json({
      success: true,
      resolvedLocation: areaInfo,
      sidebarCategories: SIDEBAR_CATEGORIES,
      topIconCategories: TOP_ICON_CATEGORIES,
      featuredAds: localizedFeaturedAds,
      riders: dbRiders.length > 0 ? dbRiders : UNIRIDE_RIDERS,
      locations: dbLocations.length > 0 ? dbLocations : LOCATION_SUGGESTIONS,
      helpTopics: HELP_CENTER_TOPICS,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load application metadata',
      error: error.message,
    });
  }
}

/**
 * GET /api/stores
 * Exported as both `getAllStores` and `getStores` so `routes/storeRoutes.js` works seamlessly.
 * Returns all stores localized to the customer's GPS/selected location with
 * attached catalog products, road distance, and dynamic ETA.
 */
export async function getAllStores(req, res) {
  try {
    const { category, subCategory, search, location, lat, lng } = req.query;
    const areaInfo = cleanLocationAreaLabel(location, lat, lng);

    const [dbStores, dbProducts] = await Promise.all([
      Store.find({}).lean(),
      Product.find({}).lean(),
    ]);

    const rawStores = dbStores && dbStores.length > 0 ? dbStores : ALL_STORES;

    // Group products by storeId so every store returned includes its catalog products
    const productsByStoreId = new Map();
    for (const prod of dbProducts) {
      if (!productsByStoreId.has(prod.storeId)) {
        productsByStoreId.set(prod.storeId, []);
      }
      productsByStoreId.get(prod.storeId).push(prod);
    }

    // Fallback to CATEGORY_PRODUCT_TEMPLATES if Product collection wasn't populated for a store
    for (const st of rawStores) {
      if (!productsByStoreId.has(st.id)) {
        const tplList =
          CATEGORY_PRODUCT_TEMPLATES[st.templateKey] ||
          CATEGORY_PRODUCT_TEMPLATES.grocery;
        productsByStoreId.set(
          st.id,
          tplList.map((tpl) => ({
            id: `${st.id}-${tpl.id}`,
            storeId: st.id,
            storeName: st.name,
            category: st.category,
            name: tpl.name,
            price: tpl.basePrice,
            basePrice: tpl.basePrice,
            tag: tpl.tag,
            rankBadge: tpl.rankBadge || null,
            likesPct: tpl.likesPct ?? 90,
            likesCount: tpl.likesCount ?? 120,
            desc: tpl.desc,
            img: tpl.img,
          }))
        );
      }
    }

    let enriched = rawStores.map((st) =>
      enrichStoreForCustomer(st, areaInfo, productsByStoreId)
    );

    if (category && category !== 'home' && category !== 'all') {
      if (category === 'offers') {
        enriched = enriched.filter((s) => Boolean(s.saleBadge));
      } else {
        enriched = enriched.filter(
          (s) => s.category === category || s.subCategory === category
        );
      }
    }

    if (subCategory && subCategory !== 'all') {
      if (subCategory === 'offers') {
        enriched = enriched.filter((s) => Boolean(s.saleBadge));
      } else {
        enriched = enriched.filter(
          (s) => s.subCategory === subCategory || s.category === subCategory
        );
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.baseName.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          (s.products || []).some((p) => p.name.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      count: enriched.length,
      resolvedLocation: areaInfo,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: error.message,
    });
  }
}

export const getStores = getAllStores;

/**
 * GET /api/stores/:id
 * Returns a single store by ID along with its full product catalog and customer distance/ETA.
 */
export async function getStoreById(req, res) {
  try {
    const storeId = req.params.id || req.params.storeId;
    const areaInfo = cleanLocationAreaLabel(
      req.query.location,
      req.query.lat,
      req.query.lng
    );

    const [storeDoc, storeProducts] = await Promise.all([
      Store.findOne({ id: storeId }).lean(),
      Product.find({ storeId }).lean(),
    ]);

    const fallbackStore =
      storeDoc || ALL_STORES.find((s) => s.id === storeId) || null;

    if (!fallbackStore) {
      return res.status(404).json({
        success: false,
        message: `Store ${storeId} not found`,
      });
    }

    const productsByStoreId = new Map();
    if (storeProducts && storeProducts.length > 0) {
      productsByStoreId.set(storeId, storeProducts);
    } else {
      const tplList =
        CATEGORY_PRODUCT_TEMPLATES[fallbackStore.templateKey] ||
        CATEGORY_PRODUCT_TEMPLATES.grocery;
      productsByStoreId.set(
        storeId,
        tplList.map((tpl) => ({
          id: `${storeId}-${tpl.id}`,
          storeId,
          storeName: fallbackStore.name,
          category: fallbackStore.category,
          name: tpl.name,
          price: tpl.basePrice,
          basePrice: tpl.basePrice,
          tag: tpl.tag,
          rankBadge: tpl.rankBadge || null,
          likesPct: tpl.likesPct ?? 90,
          likesCount: tpl.likesCount ?? 120,
          desc: tpl.desc,
          img: tpl.img,
        }))
      );
    }

    const enriched = enrichStoreForCustomer(
      fallbackStore,
      areaInfo,
      productsByStoreId
    );

    return res.json({
      success: true,
      resolvedLocation: areaInfo,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store details',
      error: error.message,
    });
  }
}

export const getSingleStore = getStoreById;
export const getStore = getStoreById;
export const getStoreDetails = getStoreById;

/**
 * GET /api/stores/search-suggestions?q=...
 * Returns autocomplete search recommendations for store names, dishes, and cuisines.
 */
export async function getSearchSuggestions(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(q, 'i');

    const [matchingProducts, matchingStores] = await Promise.all([
      Product.find({ name: regex }).limit(6).select('name storeName category'),
      Store.find({ name: regex }).limit(4).select('name templateKey'),
    ]);

    const suggestions = [];
    suggestions.push(q.toLowerCase());
    suggestions.push(`${q.toLowerCase()} near me`);

    matchingProducts.forEach((p) => {
      const lower = p.name.toLowerCase();
      if (!suggestions.includes(lower)) suggestions.push(lower);
    });

    matchingStores.forEach((s) => {
      if (!suggestions.includes(s.name)) suggestions.push(s.name);
    });

    suggestions.push(`Search for "${q}"`);

    return res.status(200).json({
      success: true,
      query: q,
      data: suggestions.slice(0, 8),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions',
      error: error.message,
    });
  }
}

/**
 * GET /api/stores/:id/products
 * Returns all catalog products belonging to a specific store.
 */
export async function getStoreProducts(req, res) {
  try {
    const storeId = req.params.id || req.params.storeId;
    const dbProducts = await Product.find({ storeId }).lean();

    if (dbProducts && dbProducts.length > 0) {
      return res.json({
        success: true,
        count: dbProducts.length,
        data: dbProducts,
      });
    }

    const fallbackStore = ALL_STORES.find((s) => s.id === storeId);
    const tplList =
      CATEGORY_PRODUCT_TEMPLATES[fallbackStore?.templateKey || 'grocery'] ||
      CATEGORY_PRODUCT_TEMPLATES.grocery;

    const generated = tplList.map((tpl) => ({
      id: `${storeId}-${tpl.id}`,
      storeId,
      storeName: fallbackStore?.name || 'UniEats Partner Store',
      category: fallbackStore?.category || 'grocery',
      name: tpl.name,
      price: tpl.basePrice,
      basePrice: tpl.basePrice,
      tag: tpl.tag,
      rankBadge: tpl.rankBadge || null,
      likesPct: tpl.likesPct ?? 90,
      likesCount: tpl.likesCount ?? 120,
      desc: tpl.desc,
      img: tpl.img,
    }));

    return res.json({
      success: true,
      count: generated.length,
      data: generated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch store products',
      error: error.message,
    });
  }
}

export const getProductsByStore = getStoreProducts;

/**
 * GET /api/stores/featured
 * Returns featured partner banners localized to the customer's location.
 */
export async function getFeaturedStores(req, res) {
  const areaInfo = cleanLocationAreaLabel(
    req.query.location,
    req.query.lat,
    req.query.lng
  );
  const localizedFeaturedAds = FEATURED_ADS.map((ad) => {
    const cleanBase = ad.name
      .replace(/\s+Battaramulla$/i, '')
      .replace(/\s*[-·]\s*.*$/, '')
      .trim();
    return {
      ...ad,
      baseName: cleanBase,
      name: `${cleanBase} – ${areaInfo.shortName}`,
      areaName: areaInfo.shortName,
    };
  });

  return res.json({
    success: true,
    count: localizedFeaturedAds.length,
    data: localizedFeaturedAds,
  });
}

export const getFeaturedAds = getFeaturedStores;

/**
 * POST /api/stores
 * Creates a new store if needed.
 */
export async function createStore(req, res) {
  try {
    const payload = req.body || {};
    const storeId = payload.id || `store-${Date.now()}`;
    const doc = await Store.findOneAndUpdate(
      { id: storeId },
      { $set: { ...payload, _id: storeId, id: storeId } },
      { upsert: true, new: true }
    ).lean();

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create store',
      error: error.message,
    });
  }
}

export const addStore = createStore;

/**
 * PUT / PATCH /api/stores/:id
 */
export async function updateStore(req, res) {
  try {
    const storeId = req.params.id || req.params.storeId;
    const doc = await Store.findOneAndUpdate(
      { id: storeId },
      { $set: req.body || {} },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: `Store ${storeId} not found`,
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update store',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/stores/:id
 */
export async function deleteStore(req, res) {
  try {
    const storeId = req.params.id || req.params.storeId;
    await Store.deleteOne({ id: storeId });
    return res.json({
      success: true,
      message: `Store ${storeId} deleted`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete store',
      error: error.message,
    });
  }
}

/**
 * POST /api/stores/:id/rate
 */
export async function rateStore(req, res) {
  try {
    const storeId = req.params.id || req.params.storeId;
    const newRating = Number(req.body?.rating || 5);
    const store = await Store.findOne({ id: storeId });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: `Store ${storeId} not found`,
      });
    }

    const currentCount = Number(store.ratingCount || 10);
    const currentAvg = Number(store.rating || 4.7);
    const updatedCount = currentCount + 1;
    const updatedAvg = Number(
      ((currentAvg * currentCount + newRating) / updatedCount).toFixed(1)
    );

    store.rating = updatedAvg;
    store.ratingCount = updatedCount;
    await store.save();

    return res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to rate store',
      error: error.message,
    });
  }
}

export const addStoreReview = rateStore;

export default {
  getAppMeta,
  getAllStores,
  getStores,
  getStoreById,
  getSingleStore,
  getStore,
  getStoreDetails,
  getStoreProducts,
  getProductsByStore,
  getFeaturedStores,
  getFeaturedAds,
  createStore,
  addStore,
  updateStore,
  deleteStore,
  rateStore,
  addStoreReview,
};
