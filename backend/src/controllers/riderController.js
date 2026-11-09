import bcrypt from 'bcryptjs';
import Rider from '../models/Rider.js';
import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';

export async function profile(req, res) {
  const [rides, orders, reviewStats] = await Promise.all([
    Ride.countDocuments({ rider: req.rider._id, status: 'completed' }),
    DeliveryOrder.countDocuments({ rider: req.rider._id, status: 'delivered' }),
    Review.aggregate([{ $match: { rider: req.rider._id } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }])
  ]);
  const stat = reviewStats[0] || { average: 0, count: 0 };
  res.json({ rider: { _id: req.rider._id, name: req.rider.name, email: req.rider.email, phone: req.rider.phone, avatar: req.rider.avatar, createdAt: req.rider.createdAt }, stats: { completedRides: rides, completedOrders: orders, rating: Number(stat.average.toFixed(1)), reviews: stat.count } });
}

export async function updateProfile(req, res) {
  const { name, email, phone } = req.body;
  if (name !== undefined && !String(name).trim()) return res.status(400).json({ message: 'Name cannot be empty.' });
  if (email !== undefined) {
    const normalized = String(email).trim().toLowerCase();
    if (!normalized) return res.status(400).json({ message: 'Email cannot be empty.' });
    const exists = await Rider.exists({ email: normalized, _id: { $ne: req.rider._id } });
    if (exists) return res.status(409).json({ message: 'That email address is already in use.' });
    req.rider.email = normalized;
  }
  if (name !== undefined) req.rider.name = String(name).trim();
  if (phone !== undefined) req.rider.phone = String(phone).trim();
  await req.rider.save();
  res.json({ message: 'Profile updated successfully.', rider: { _id: req.rider._id, name: req.rider.name, email: req.rider.email, phone: req.rider.phone, avatar: req.rider.avatar, createdAt: req.rider.createdAt } });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Enter your current and new password.' });
  if (String(newPassword).length < 6) return res.status(400).json({ message: 'New password must contain at least 6 characters.' });
  const rider = await Rider.findById(req.rider._id).select('+passwordHash');
  const match = await bcrypt.compare(currentPassword, rider.passwordHash);
  if (!match) return res.status(400).json({ message: 'Current password is incorrect.' });
  rider.passwordHash = await bcrypt.hash(newPassword, 12);
  await rider.save();
  res.json({ message: 'Password changed successfully.' });
}

export async function dashboard(req, res) {
  const riderId = req.rider._id;
  const [rides, orders, rideCounts, orderCounts, reviews] = await Promise.all([
    Ride.find({ rider: riderId }).sort({ createdAt: -1 }).limit(5).lean(),
    DeliveryOrder.find({ rider: riderId }).sort({ createdAt: -1 }).limit(5).lean(),
    Ride.aggregate([{ $match: { rider: riderId, status: 'completed' } }, { $group: { _id: null, count: { $sum: 1 }, spend: { $sum: '$fare' } } }]),
    DeliveryOrder.aggregate([{ $match: { rider: riderId, status: 'delivered' } }, { $group: { _id: null, count: { $sum: 1 }, spend: { $sum: '$total' } } }]),
    Review.aggregate([{ $match: { rider: riderId } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }])
  ]);
  const ride = rideCounts[0] || { count: 0, spend: 0 };
  const order = orderCounts[0] || { count: 0, spend: 0 };
  res.json({ stats: { rides: ride.count, orders: order.count, totalSpent: ride.spend + order.spend, rating: Number((reviews[0]?.avg || 0).toFixed(1)) }, recent: [...rides.map((x) => ({ ...x, kind: 'ride', date: x.createdAt, amount: x.fare })), ...orders.map((x) => ({ ...x, kind: 'delivery', date: x.createdAt, amount: x.total }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6) });
}

export async function spending(req, res) {
  const riderId = req.rider._id;
  const [rides, orders] = await Promise.all([
    Ride.find({ rider: riderId, status: 'completed' }).select('pickup destination fare completedAt createdAt').lean(),
    DeliveryOrder.find({ rider: riderId, status: 'delivered' }).select('orderType shop total deliveredAt createdAt receiptNumber').lean()
  ]);
  const transactions = [
    ...rides.map((r) => ({ id: String(r._id), type: 'Ride', title: `${r.pickup.address} → ${r.destination.address}`, date: r.completedAt || r.createdAt, amount: r.fare })),
    ...orders.map((o) => ({ id: String(o._id), type: o.orderType === 'food' ? 'Food order' : 'Product order', title: `${o.shop} · ${o.receiptNumber || 'Order'}`, date: o.deliveredAt || o.createdAt, amount: o.total }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = transactions.reduce((sum, x) => sum + x.amount, 0);
  const currentMonth = new Date();
  const monthTotal = transactions.filter((x) => { const d = new Date(x.date); return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear(); }).reduce((sum, x) => sum + x.amount, 0);
  res.json({ total, monthTotal, transactions });
}
