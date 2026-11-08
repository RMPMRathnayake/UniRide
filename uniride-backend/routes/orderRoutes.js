import express from 'express';
import { createOrder, getOrders } from '../controllers/orderController.js';

const router = express.Router();

// POST /api/orders
router.post('/', createOrder);

// GET /api/orders
router.get('/', getOrders);

export default router;
