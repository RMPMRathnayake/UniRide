import DeliveryOrder from '../models/DeliveryOrder.js';
import Pricing from '../models/Pricing.js';
import { foods, products } from '../data/catalog.js';

const DEFAULT_COORDINATES = [81.856875, 7.300617];
const toPoint = (address, coordinates, fallbackAddress) => ({
  address: String(address || fallbackAddress),
  coordinates: Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every((value) => Number.isFinite(Number(value))) ? coordinates.map(Number) : DEFAULT_COORDINATES
});
const distanceKm = (a, b) => {
  const [lon1, lat1] = a.coordinates; const [lon2, lat2] = b.coordinates;
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(1));
};
const publicDriver = (driver) => driver ? ({ name: driver.name, phone: driver.phone, vehicle: `${driver.vehicleType || 'Vehicle'} · ${driver.vehicleNumber || ''}`.trim() }) : null;

export async function listOrders(req, res) {
  const scope = req.query.scope || 'all';
  const filter = { rider: req.rider._id };
  if (scope === 'active') filter.status = { $in: ['pending', 'accepted', 'picked_up'] };
  if (scope === 'completed') filter.status = 'delivered';
  if (scope === 'cancelled') filter.status = 'cancelled';
  const orders = await DeliveryOrder.find(filter).populate('driver').sort({ createdAt: -1 }).lean();
  res.json({ orders: orders.map((order) => ({ ...order, driver: publicDriver(order.driver) })) });
}

export async function createOrder(req, res) {
  const { orderType, items, shop, deliveryAddress, deliveryCoordinates = [], paymentMethod = 'Cash on delivery' } = req.body;
  if (!['product', 'food'].includes(orderType)) return res.status(400).json({ message: 'Choose a valid order type.' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Add at least one item to your order.' });
  if (!shop?.trim() || !deliveryAddress?.trim()) return res.status(400).json({ message: 'Shop and delivery address are required.' });
  if (!Array.isArray(deliveryCoordinates) || (deliveryCoordinates.length !== 0 && (deliveryCoordinates.length !== 2 || !deliveryCoordinates.every((x) => Number.isFinite(Number(x)))))) return res.status(400).json({ message: 'Delivery coordinates are invalid.' });

  // Prices and descriptions are always taken from the server catalogue.
  const catalogue = orderType === 'food' ? foods : products;
  const normalizedItems = [];
  for (const requested of items) {
    const item = catalogue.find((entry) => entry._id === String(requested.itemId || ''));
    if (!item) return res.status(400).json({ message: 'One or more selected items are no longer available.' });
    const quantity = Math.max(1, Math.min(30, Math.floor(Number(requested.quantity) || 1)));
    normalizedItems.push({ itemId: item._id, name: item.name, image: item.image, shop: item.shop, price: item.price, quantity });
  }
  const canonicalShop = normalizedItems[0].shop;
  if (normalizedItems.some((item) => item.shop !== canonicalShop) || canonicalShop !== shop.trim()) return res.status(400).json({ message: 'An order can contain items from one shop only.' });
  const selectedMeals = orderType === 'food'
    ? new Set(normalizedItems.map((item) => catalogue.find((entry) => entry._id === item.itemId)?.meal).filter(Boolean))
    : new Set();
  const canonicalMeal = selectedMeals.size === 1 ? [...selectedMeals][0] : selectedMeals.size > 1 ? 'Mixed' : '';

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pricing = await Pricing.findOne({ key: 'global' }).lean();
  const deliveryFee = Number(pricing?.deliverySurcharge ?? 100);
  const cataloguePickup = catalogue.find((entry) => entry._id === normalizedItems[0].itemId);
  const pickup = toPoint(cataloguePickup.pickupAddress || canonicalShop, cataloguePickup.pickupCoordinates, canonicalShop);
  const dropoff = toPoint(deliveryAddress.trim(), deliveryCoordinates, deliveryAddress.trim());
  const receiptNumber = `UR-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
  const total = subtotal + deliveryFee;
  const order = await DeliveryOrder.create({
    rider: req.rider._id, orderType, items: normalizedItems, shop: canonicalShop, meal: canonicalMeal,
    deliveryAddress: deliveryAddress.trim(), deliveryCoordinates: dropoff.coordinates,
    pickupAddress: pickup.address, pickupCoordinates: pickup.coordinates,
    subtotal, deliveryFee, total,
    paymentMethod: paymentMethod === 'Cash on delivery' ? paymentMethod : 'Cash on delivery',
    receiptNumber, orderCode: receiptNumber,
    customerName: req.rider.name, customerPhone: req.rider.phone || '',
    pickup, dropoff, packageDescription: normalizedItems.map((item) => `${item.name} × ${item.quantity}`).join(', '),
    distanceKm: distanceKm(pickup, dropoff), totalAmount: total, driverEarning: Math.round(deliveryFee * 0.75),
    status: 'pending'
  });
  res.status(201).json({ message: 'Your order has been placed and is now available to delivery drivers.', order });
}

export async function updateOrderStatus(req, res) {
  const order = await DeliveryOrder.findOne({ _id: req.params.id, rider: req.rider._id });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (req.body.status !== 'cancelled') return res.status(400).json({ message: 'Only the assigned delivery driver can update delivery progress.' });
  if (order.status !== 'pending') return res.status(409).json({ message: 'An order can only be cancelled before a driver accepts it.' });
  order.status = 'cancelled';
  await order.save();
  res.json({ message: 'Order cancelled.', order });
}
