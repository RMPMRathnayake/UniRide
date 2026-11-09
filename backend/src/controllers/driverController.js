import bcrypt from 'bcryptjs';
import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';
import { httpError } from '../utils/httpError.js';

export async function getDashboard(req, res) {
  const driverId = req.driver._id;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [availableRides, availableOrders, activeRides, activeOrders, completedRides, completedOrders, reviewStats, todayRideEarnings, todayOrderEarnings] = await Promise.all([
    Ride.countDocuments({ status: 'available', driver: null }),
    DeliveryOrder.countDocuments({ status: 'pending', driver: null }),
    Ride.countDocuments({ driver: driverId, status: { $in: ['accepted', 'in_progress'] } }),
    DeliveryOrder.countDocuments({ driver: driverId, status: { $in: ['accepted', 'picked_up'] } }),
    Ride.countDocuments({ driver: driverId, status: 'completed' }),
    DeliveryOrder.countDocuments({ driver: driverId, status: 'delivered' }),
    Review.aggregate([{ $match: { driver: driverId } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Ride.aggregate([{ $match: { driver: driverId, status: 'completed', completedAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$driverEarning' } } }]),
    DeliveryOrder.aggregate([{ $match: { driver: driverId, status: 'delivered', deliveredAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$driverEarning' } } }])
  ]);

  res.json({
    stats: {
      availableJobs: availableRides + availableOrders,
      activeJobs: activeRides + activeOrders,
      completedJobs: completedRides + completedOrders,
      todayEarnings: (todayRideEarnings[0]?.total || 0) + (todayOrderEarnings[0]?.total || 0),
      averageRating: Number((reviewStats[0]?.average || 0).toFixed(1)),
      reviewCount: reviewStats[0]?.count || 0,
      availableRides,
      availableOrders,
      activeRides,
      activeOrders
    }
  });
}

export async function getProfile(req, res) {
  res.json({ driver: req.driver });
}

export async function updateProfile(req, res) {
  const { name, email, phone } = req.body;
  const updates = {};
  if (name !== undefined) {
    const value = String(name).trim();
    if (!value || value.length > 80) throw httpError(400, 'Name must be between 1 and 80 characters.');
    updates.name = value;
  }
  if (email !== undefined) {
    const value = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) throw httpError(400, 'Enter a valid email address.');
    const existing = await Driver.findOne({ email: value, _id: { $ne: req.driver._id } });
    if (existing) throw httpError(409, 'That email address is already in use.');
    updates.email = value;
  }
  if (phone !== undefined) {
    const value = String(phone).trim();
    if (!value || value.length > 24) throw httpError(400, 'Enter a valid phone number.');
    updates.phone = value;
  }

  const driver = await Driver.findByIdAndUpdate(req.driver._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ message: 'Profile updated successfully.', driver });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw httpError(400, 'Current and new passwords are required.');
  if (String(newPassword).length < 8) throw httpError(400, 'New password must be at least 8 characters.');

  const driver = await Driver.findById(req.driver._id).select('+password');
  if (!(await bcrypt.compare(currentPassword, driver.password))) throw httpError(400, 'Current password is incorrect.');
  driver.password = await bcrypt.hash(newPassword, 12);
  await driver.save();
  res.json({ message: 'Password changed successfully.' });
}

export async function updateAvailability(req, res) {
  const status = req.body.status;
  if (!['online', 'offline'].includes(status)) throw httpError(400, 'Choose Available or Not Available.');
  if (status === 'online' && req.driver.documentStatus !== 'approved') throw httpError(403, 'Your driver account is awaiting administrator approval. You can become Available after verification.');
  const driver = await Driver.findByIdAndUpdate(req.driver._id, { status }, { new: true });
  res.json({ message: status === 'online' ? 'You are now Available.' : 'You are now Not Available.', driver });
}
