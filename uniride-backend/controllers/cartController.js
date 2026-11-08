import Cart from '../models/Cart.js';

/**
 * GET /api/cart?userId=...
 * Retrieves the user's persistent cart from MongoDB.
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.query.userId || 'guest';
    let cart = await Cart.findOne({ userId }).lean();

    if (!cart) {
      cart = { userId, items: [] };
    }

    return res.status(200).json({
      success: true,
      data: cart.items || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cart from MongoDB',
      error: error.message,
    });
  }
};

/**
 * POST /api/cart
 * Saves or updates the user's persistent cart in MongoDB.
 */
export const syncCart = async (req, res) => {
  try {
    const { userId = 'guest', items = [] } = req.body;

    const updated = await Cart.findOneAndUpdate(
      { userId },
      { items, updatedAt: new Date() },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Cart synced with MongoDB successfully',
      data: updated.items || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to sync cart to MongoDB',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/cart?userId=...
 * Clears the user's cart in MongoDB (e.g. after successful order placement).
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.query.userId || req.body?.userId || 'guest';
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully in MongoDB',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart in MongoDB',
      error: error.message,
    });
  }
};
