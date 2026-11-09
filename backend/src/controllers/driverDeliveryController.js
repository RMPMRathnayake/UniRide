import DeliveryOrder from '../models/DeliveryOrder.js';
import { httpError } from '../utils/httpError.js';

export async function listDeliveries(req, res) {
  const scope = req.query.scope || 'available';
  const filters = {
    available: { status: 'pending', driver: null },
    active: { driver: req.driver._id, status: { $in: ['accepted', 'picked_up'] } },
    completed: { driver: req.driver._id, status: 'delivered' }
  };
  if (!filters[scope]) throw httpError(400, 'Unknown delivery scope.');
  const orders = await DeliveryOrder.find(filters[scope]).sort({ requestedAt: scope === 'completed' ? -1 : 1 }).limit(100);
  res.json({ orders });
}

export async function acceptDelivery(req, res) {
  if (req.driver.documentStatus !== 'approved') throw httpError(403, 'Your driver account must be approved by an administrator before accepting jobs.');
  if (req.driver.status !== 'online') throw httpError(403, 'Set your availability to Available before accepting a new job.');
  const order = await DeliveryOrder.findOneAndUpdate(
    { _id: req.params.id, status: 'pending', driver: null },
    { $set: { status: 'accepted', driver: req.driver._id, acceptedAt: new Date() } },
    { new: true }
  );
  if (!order) throw httpError(409, 'This delivery is no longer available. Refresh the list and try another order.');
  res.json({ message: 'Delivery accepted.', order });
}

export async function updateDeliveryStatus(req, res) {
  const { status } = req.body;
  const transitions = { picked_up: ['accepted'], delivered: ['picked_up'] };
  if (!transitions[status]) throw httpError(400, 'Invalid delivery status transition.');
  const update = { status };
  if (status === 'picked_up') update.pickedUpAt = new Date();
  if (status === 'delivered') update.deliveredAt = new Date();

  const order = await DeliveryOrder.findOneAndUpdate(
    { _id: req.params.id, driver: req.driver._id, status: { $in: transitions[status] } },
    { $set: update },
    { new: true }
  );
  if (!order) throw httpError(409, 'Delivery status could not be updated. Refresh and check its current status.');
  res.json({ message: `Order marked ${status.replace('_', ' ')}.`, order });
}
