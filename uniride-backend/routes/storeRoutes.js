import express from 'express';
import {
  getAllStores,
  getStoreById,
  getAppMeta,
  getSearchSuggestions,
} from '../controllers/storeController.js';

const router = express.Router();

// GET /api/stores/meta -> Returns Riders, Sidebar/Top Categories, Featured Ads, and FAQs
router.get('/meta', getAppMeta);

// GET /api/stores/search-suggestions?q=... -> Autocomplete food/shop search suggestions
router.get('/search-suggestions', getSearchSuggestions);

// GET /api/stores?category=&subCategory=&search=&lat=&lng=
router.get('/', getAllStores);

// GET /api/stores/:id
router.get('/:id', getStoreById);

export default router;
