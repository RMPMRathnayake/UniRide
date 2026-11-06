import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Vehicle from "../models/Vehicle.js";
import Ride from "../models/Ride.js";
import Delivery from "../models/Delivery.js";
import Payment from "../models/Payment.js";
import Feedback from "../models/Feedback.js";
import Pricing from "../models/Pricing.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { writeAudit } from "../utils/audit.js";

const safeLimit = (value) => Math.min(Math.max(Number(value) || 100, 1), 500);
const list = (Model, sort = { createdAt: -1 }) => async (req, res, next) => {
  try {
    const limit = safeLimit(req.query.limit);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const q = String(req.query.q || "").trim();
    const filter = q ? { $or: ["name", "email", "studentName", "driverName", "rideCode", "deliveryCode", "transactionCode", "plateNumber", "licenseNumber"].map(field => ({ [field]: { $regex: q, $options: "i" } })) } : {};
    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Model.countDocuments(filter)
    ]);
    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export async function dashboard(_req, res, next) {
  try {
    const [students, drivers, pendingDrivers, rides, activeRides, deliveries, payments, revenue, recentRides, queue] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Driver.countDocuments(),
      Driver.countDocuments({ documentStatus: "pending" }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ["accepted", "in_transit"] } }),
      Delivery.countDocuments({ status: { $in: ["pending", "accepted", "in_transit"] } }),
      Payment.countDocuments(),
      Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Ride.find().sort({ createdAt: -1 }).limit(5).lean(),
      Driver.find({ documentStatus: "pending" }).sort({ createdAt: 1 }).limit(5).lean()
    ]);
    res.json({
      stats: { students, drivers, pendingDrivers, rides, activeRides, activeDeliveries: deliveries, payments, revenue: revenue[0]?.total || 0 },
      recentRides, pendingDriverQueue: queue
    });
  } catch (error) { next(error); }
}

export const users = list(User);
export const drivers = list(Driver);
export const vehicles = list(Vehicle);
export const rides = list(Ride);
export const deliveries = list(Delivery);
export const payments = list(Payment);
export const feedback = list(Feedback);
export const auditLogs = list(AuditLog);
export const roles = async (_req, res) => res.json({ items: [{ role: "admin", description: "Manage the platform and administrative features" }, { role: "student", description: "Request rides and deliveries" }, { role: "driver", description: "Accept and fulfil service requests" }] });

export async function updateUserStatus(req, res, next) {
  try {
    if (!["active", "suspended"].includes(req.body.status)) return res.status(400).json({ message: "Status must be active or suspended." });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin") return res.status(400).json({ message: "Admin accounts cannot be changed here." });
    user.status = req.body.status;
    await user.save();
    await writeAudit(req, "user.status.updated", user.email, `Status set to ${user.status}`);
    res.json({ message: "User status updated.", item: { id: user._id, status: user.status } });
  } catch (error) { next(error); }
}

export async function updateDriverVerification(req, res, next) {
  try {
    const { status, reason = "" } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ message: "Invalid verification status." });
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    driver.documentStatus = status;
    driver.rejectionReason = status === "rejected" ? String(reason).trim().slice(0, 500) : "";
    await driver.save();
    await writeAudit(req, `driver.verification.${status}`, driver.name, driver.rejectionReason);
    res.json({ message: `Driver verification ${status}.`, item: driver });
  } catch (error) { next(error); }
}

export async function getPricing(_req, res, next) {
  try {
    let pricing = await Pricing.findOne({ key: "global" }).lean();
    if (!pricing) pricing = await Pricing.create({ key: "global" });
    res.json({ item: pricing });
  } catch (error) { next(error); }
}

export async function updatePricing(req, res, next) {
  try {
    const fields = ["baseFare", "perKmRate", "deliverySurcharge"];
    const values = {};
    for (const field of fields) {
      const value = Number(req.body[field]);
      if (!Number.isFinite(value) || value < 0 || value > 1000000) return res.status(400).json({ message: `${field} must be a valid non-negative amount.` });
      values[field] = value;
    }
    const item = await Pricing.findOneAndUpdate({ key: "global" }, { $set: { ...values, updatedBy: req.user.email } }, { new: true, upsert: true, runValidators: true });
    await writeAudit(req, "pricing.updated", "global", JSON.stringify(values));
    res.json({ message: "Pricing updated.", item });
  } catch (error) { next(error); }
}

export async function notifications(req, res, next) {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items, unread: items.filter(item => !item.read).length });
  } catch (error) { next(error); }
}

export async function markNotificationRead(req, res, next) {
  try {
    const item = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!item) return res.status(404).json({ message: "Notification not found." });
    res.json({ item });
  } catch (error) { next(error); }
}

export async function reports(_req, res, next) {
  try {
    const [ridesByStatus, deliveriesByStatus, paymentTotals] = await Promise.all([
      Ride.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Delivery.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }])
    ]);
    res.json({ ridesByStatus, deliveriesByStatus, paymentTotals });
  } catch (error) { next(error); }
}
