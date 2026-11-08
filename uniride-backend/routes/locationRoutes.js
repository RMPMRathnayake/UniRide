import express from 'express';
import {
  getLocationSuggestions,
  detectLocation,
} from '../controllers/locationController.js';

const router = express.Router();

// GET /api/locations/suggestions?q=
router.get('/suggestions', getLocationSuggestions);

// GET /api/locations/detect?lat=&lng=
router.get('/detect', detectLocation);

export default router;
