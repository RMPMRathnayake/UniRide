import User from '../models/User.js';
import Rider from '../models/Rider.js';
import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';
import Pricing from '../models/Pricing.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

const safeLimit = (value) => Math.min(Math.max(Number(value) || 100, 1), 500);
const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
const address = (point) => point?.address || point || '';
const nameOf = (record, fallback = '') => record?.name || record?.fullName || fallback;
const searchAndPage = (records, req) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const filtered = q ? records.filter((item) => Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(q))) : records;
  const limit = safeLimit(req.query.limit);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const items = filtered.slice((page - 1) * limit, page * limit);
  return { items, pagination: { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) } };
};
const rideView = (ride) => ({
  _id: ride._id, rideCode: ride.bookingCode || `RIDE-${String(ride._id).slice(-6).toUpperCase()}`,
  studentName: ride.passengerName || nameOf(ride.rider, 'Student'), driverName: nameOf(ride.driver, ''),
  pickup: address(ride.pickup), destination: address(ride.destination || ride.dropoff), fare: Number(ride.fare ?? ride.estimatedFare ?? 0),
  status: ({ available: 'pending', searching: 'pending', driver_assigned: 'accepted', accepted: 'accepted', in_progress: 'in_transit', completed: 'completed', cancelled: 'cancelled' })[ride.status] || ride.status,
  createdAt: ride.createdAt, paymentMethod: ride.paymentMethod || 'Cash'
});
const deliveryView = (order) => ({
  _id: order._id, deliveryCode: order.orderCode || order.receiptNumber || `DEL-${String(order._id).slice(-6).toUpperCase()}`,
  studentName: order.customerName || nameOf(order.rider, 'Student'), driverName: nameOf(order.driver, ''),
  items: (order.items || []).map((item) => `${item.name || 'Item'} × ${item.quantity || 1}`).join(', ') || order.packageDescription || order.orderType || 'Delivery',
  pickup: address(order.pickup) || order.shop || order.pickupAddress || '', destination: address(order.dropoff) || order.deliveryAddress || '',
  amount: Number(order.totalAmount ?? order.total ?? 0), status: ({ pending: 'pending', accepted: 'accepted', picked_up: 'in_transit', delivered: 'delivered', cancelled: 'cancelled' })[order.status] || order.status,
  createdAt: order.createdAt, paymentMethod: order.paymentMethod || 'Cash'
});

export async function dashboard(_req, res) {
  const [riderRecords, legacyStudentRecords, drivers, pendingDrivers, rides, activeRides, activeDeliveries, recentRideDocs, queueDocs] = await Promise.all([
    Rider.find().select('email').lean(), User.find({ role: 'student' }).select('email').lean(), Driver.countDocuments(), Driver.countDocuments({ documentStatus: 'pending' }), Ride.countDocuments(),
    Ride.countDocuments({ status: { $in: ['available', 'searching', 'driver_assigned', 'accepted', 'in_progress'] } }),
    DeliveryOrder.countDocuments({ status: { $in: ['pending', 'accepted', 'picked_up'] } }),
    Ride.find().populate('rider', 'name').populate('driver', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    Driver.find({ documentStatus: 'pending' }).sort({ createdAt: 1 }).limit(5).lean()
  ]);
  const [deliveryCount, feedbackCount] = await Promise.all([DeliveryOrder.countDocuments(), Review.countDocuments()]);
  const students = new Set([...riderRecords, ...legacyStudentRecords].map((item) => item.email).filter(Boolean)).size;
  res.json({
    stats: { students, drivers, pendingDrivers, rides, activeRides, activeDeliveries, deliveries: deliveryCount, feedback: feedbackCount },
    recentRides: recentRideDocs.map(rideView),
    pendingDriverQueue: queueDocs.map((driver) => ({ ...driver, vehiclePlate: driver.vehicleNumber || '', availability: driver.status === 'online' ? 'Available' : 'Not Available' }))
  });
}

export async function users(req, res) {
  const [riders, legacy] = await Promise.all([
    Rider.find().sort({ createdAt: -1 }).lean(),
    User.find({ role: 'student' }).select('name fullName email phone phoneNumber status createdAt').lean()
  ]);
  const seen = new Set();
  const records = [...riders.map((r) => ({ _id: r._id, name: r.name, email: r.email, role: 'student', phone: r.phone, status: r.status || 'active', createdAt: r.createdAt })),
    ...legacy.map((u) => ({ _id: u._id, name: u.name || u.fullName, email: u.email, role: 'student', phone: u.phone || u.phoneNumber, status: u.status || 'active', createdAt: u.createdAt }))]
    .filter((item) => { if (seen.has(item.email)) return false; seen.add(item.email); return true; });
  res.json(searchAndPage(records, req));
}

export async function updateUserStatus(req, res) {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Status must be active or suspended.' });
  let item = await Rider.findById(req.params.id);
  if (item) { item.status = status; await item.save(); }
  else item = await User.findOneAndUpdate({ _id: req.params.id, role: 'student' }, { status }, { new: true });
  if (!item) return res.status(404).json({ message: 'Student account not found.' });
  await writeAudit(req, 'user.status.updated', item.email, `Status set to ${status}`);
  res.json({ message: 'User status updated.', item: { id: item._id, status } });
}

export async function drivers(req, res) {
  const records = (await Driver.find().sort({ createdAt: -1 }).lean()).map((driver) => ({
    ...driver, vehiclePlate: driver.vehicleNumber || '', availability: driver.status === 'online' ? 'Available' : 'Not Available', documentStatus: driver.documentStatus || 'pending'
  }));
  res.json(searchAndPage(records, req));
}

export async function updateDriverVerification(req, res) {
  const { status, reason = '' } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: 'Invalid verification status.' });
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });
  driver.documentStatus = status;
  driver.rejectionReason = status === 'rejected' ? String(reason).trim().slice(0, 500) : '';
  await driver.save();
  await writeAudit(req, `driver.verification.${status}`, driver.name, driver.rejectionReason);
  res.json({ message: `Driver verification ${status}.`, item: driver });
}

export async function vehicles(req, res) {
  const records = (await Driver.find().sort({ createdAt: -1 }).lean()).map((driver) => ({
    _id: driver._id, plateNumber: driver.vehicleNumber || 'Not supplied', driverName: driver.name,
    type: driver.vehicleType || 'Vehicle', status: driver.documentStatus === 'approved' ? 'verified' : driver.documentStatus || 'pending', createdAt: driver.createdAt
  }));
  res.json(searchAndPage(records, req));
}

export async function rides(req, res) {
  const docs = await Ride.find().populate('rider', 'name').populate('driver', 'name').sort({ createdAt: -1 }).lean();
  res.json(searchAndPage(docs.map(rideView), req));
}

export async function deliveries(req, res) {
  const docs = await DeliveryOrder.find().populate('rider', 'name').populate('driver', 'name').sort({ createdAt: -1 }).lean();
  res.json(searchAndPage(docs.map(deliveryView), req));
}

export async function payments(req, res) {
  const [rideDocs, orderDocs] = await Promise.all([
    Ride.find().populate('rider', 'name').sort({ createdAt: -1 }).lean(),
    DeliveryOrder.find().populate('rider', 'name').sort({ createdAt: -1 }).lean()
  ]);
  const records = [
    ...rideDocs.map((ride) => ({ _id: `ride-${ride._id}`, transactionCode: ride.bookingCode || `RIDE-${String(ride._id).slice(-6).toUpperCase()}`, customerName: ride.passengerName || nameOf(ride.rider, 'Student'), serviceType: 'ride', amount: Number(ride.fare || ride.estimatedFare || 0), method: ride.paymentMethod || 'Cash', status: 'not_recorded', createdAt: ride.createdAt })),
    ...orderDocs.map((order) => ({ _id: `delivery-${order._id}`, transactionCode: order.orderCode || order.receiptNumber || `DEL-${String(order._id).slice(-6).toUpperCase()}`, customerName: order.customerName || nameOf(order.rider, 'Student'), serviceType: 'delivery', amount: Number(order.totalAmount || order.total || 0), method: order.paymentMethod || 'Cash', status: 'not_recorded', createdAt: order.createdAt }))
  ].sort(byNewest);
  res.json(searchAndPage(records, req));
}

export async function feedback(req, res) {
  const records = (await Review.find().populate('rider', 'name').populate('driver', 'name').sort({ createdAt: -1 }).lean()).map((review) => ({
    _id: review._id, studentName: review.customerName || nameOf(review.rider, 'Student'), driverName: nameOf(review.driver, ''), rating: review.rating,
    comment: review.comment || '', status: 'submitted', createdAt: review.createdAt, serviceType: review.serviceType || review.targetType
  }));
  res.json(searchAndPage(records, req));
}

export const auditLogs = async (req, res) => res.json(searchAndPage(await AuditLog.find().sort({ createdAt: -1 }).lean(), req));
export const roles = async (_req, res) => res.json({ items: [
  { role: 'admin', description: 'Manage the platform and administrative features' },
  { role: 'student', description: 'Request rides and deliveries' },
  { role: 'driver', description: 'Accept and fulfil service requests' }
] });

export async function getPricing(_req, res) {
  let pricing = await Pricing.findOne({ key: 'global' }).lean();
  if (!pricing) pricing = await Pricing.create({ key: 'global' });
  res.json({ item: pricing });
}
export async function updatePricing(req, res) {
  const values = {};
  for (const field of ['baseFare', 'perKmRate', 'deliverySurcharge']) {
    const value = Number(req.body[field]);
    if (!Number.isFinite(value) || value < 0 || value > 1000000) return res.status(400).json({ message: `${field} must be a valid non-negative amount.` });
    values[field] = value;
  }
  const item = await Pricing.findOneAndUpdate({ key: 'global' }, { $set: { ...values, updatedBy: req.user.email } }, { new: true, upsert: true, runValidators: true });
  await writeAudit(req, 'pricing.updated', 'global', JSON.stringify(values));
  res.json({ message: 'Pricing updated.', item });
}
export async function notifications(_req, res) {
  const items = await Notification.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ items, unread: items.filter((item) => !item.read).length });
}
export async function markNotificationRead(req, res) {
  const item = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!item) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ item });
}
export async function reports(_req, res) {
  const [ridesByStatus, deliveriesByStatus, paymentTotals] = await Promise.all([
    Ride.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: { $ifNull: ['$fare', '$estimatedFare'] } } } }]),
    DeliveryOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } }]),
    Promise.resolve([])
  ]);
  res.json({ ridesByStatus, deliveriesByStatus, paymentTotals });
}

export async function writeAudit(req, action, target = '', details = '') {
  try { await AuditLog.create({ actor: req.user?.name || req.user?.email || 'Admin', action, target, details, ip: req.ip || '' }); }
  catch (error) { console.error('Unable to write audit log:', error.message); }
}
