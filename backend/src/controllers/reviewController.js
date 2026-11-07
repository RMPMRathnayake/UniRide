import Review from '../models/Review.js';

export async function getReviews(req, res) {
  const [reviews, aggregate] = await Promise.all([
    Review.find({ driver: req.driver._id }).sort({ createdAt: -1 }).limit(100),
    Review.aggregate([
      { $match: { driver: req.driver._id } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 }, five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }, four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } }, three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } }, two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } }, one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } } } }
    ])
  ]);
  const stats = aggregate[0] || { average: 0, count: 0, five: 0, four: 0, three: 0, two: 0, one: 0 };
  res.json({ reviews, stats: { average: Number(stats.average.toFixed(1)), count: stats.count, distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: stats[['', 'one', 'two', 'three', 'four', 'five'][rating]] })) } });
}
