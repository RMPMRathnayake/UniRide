import { Router } from 'express';
import { foods, products } from '../data/catalog.js';
const router = Router();
router.get('/products', (_req, res) => res.json({ products }));
router.get('/food', (_req, res) => res.json({ foods }));
export default router;
