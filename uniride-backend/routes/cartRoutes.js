import express from 'express';
import { getCart, syncCart, clearCart } from '../controllers/cartController.js';

const router = express.Router();

// GET /api/cart?userId=...
router.get('/', getCart);

// POST /api/cart
router.post('/', syncCart);

// DELETE /api/cart
router.delete('/', clearCart);

export default router;
