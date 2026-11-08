import Order from '../models/Order.js';

/**
 * POST /api/orders
 * Saves placed orders from the checkout flow using `await Order.create(...)`
 * and returns `orderId` and `timestamp`.
 */
export const createOrder = async (req, res) => {
  try {
    const body = req.body || {};
    const orderId =
      body.orderId || `ORD-UNIEATS-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload = {
      orderId,
      txnId: body.txnId || `TXN-${Date.now()}`,
      service: body.service || 'uniEats',
      storeId: body.storeId || body.items?.[0]?.storeId || 'store-pizzahut',
      storeName: body.storeName || body.items?.[0]?.storeName || 'UniEats Partner Store',
      items: Array.isArray(body.items) ? body.items : [],
      subtotal: Number(body.subtotal || 0),
      promotion: Number(body.promotion || 0),
      deliveryFee: Number(body.deliveryFee ?? 99),
      taxes: Number(body.taxes || 0),
      total: Number(body.total ?? body.totalPaid ?? 0),
      deliveryAddress: body.deliveryAddress || 'Parakaduwa',
      dropoffMethod: body.dropoffMethod || 'Meet at my door',
      deliveryInstructions: body.deliveryInstructions || '',
      deliveryOptionType: body.deliveryOptionType || 'standard',
      paymentMethod: body.paymentMethod || 'Card',
      status: body.status || 'PAID',
      timestamp: new Date(),
    };

    const savedOrder = await Order.create(orderPayload);

    return res.status(201).json({
      success: true,
      orderId: savedOrder.orderId,
      timestamp: savedOrder.timestamp,
      data: savedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

/**
 * GET /api/orders
 * Returns all saved orders using `await Order.find().sort({ timestamp: -1 })`.
 */
export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find({}).sort({ timestamp: -1 }).lean();
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};
