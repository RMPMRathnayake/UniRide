import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';

export async function listReviews(req, res) {
  const reviews = await Review.find({ rider: req.rider._id }).sort({ createdAt: -1 }).lean();
  res.json({ reviews });
}

export async function createReview(req, res) {
  const { targetType, targetId, rating, comment = '' } = req.body;
  if (!['ride', 'delivery'].includes(targetType) || !targetId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ message: 'Select a valid item and a rating from 1 to 5.' });
  }
  const Model = targetType === 'ride' ? Ride : DeliveryOrder;
  const status = targetType === 'ride' ? 'completed' : 'delivered';
  const target = await Model.findOne({ _id: targetId, rider: req.rider._id, status });
  if (!target) return res.status(404).json({ message: 'Only completed rides or delivered orders can be reviewed.' });
  const existing = await Review.findOne({ rider: req.rider._id, targetId });
  if (existing) return res.status(409).json({ message: 'You have already reviewed this trip or order.' });
  const targetName = targetType === 'ride' ? `${target.pickup.address} → ${(target.destination || target.dropoff).address}` : target.shop;
  const ratingValue = Number(rating);
  const text = String(comment).trim();
  const review = await Review.create({
    rider: req.rider._id, driver: target.driver || null, customerName: req.rider.name,
    targetType, serviceType: targetType, targetId, targetName, rating: ratingValue, comment: text
  });
  target.rating = ratingValue;
  target.review = text;
  await target.save();
  res.status(201).json({ message: 'Thank you for your review.', review });
}
