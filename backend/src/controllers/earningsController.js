import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';

export async function getEarnings(req, res) {
  const driverId = req.driver._id;
  const [rides, orders] = await Promise.all([
    Ride.find({ driver: driverId, status: 'completed' }).select('bookingCode driverEarning completedAt pickup dropoff').lean(),
    DeliveryOrder.find({ driver: driverId, status: 'delivered' }).select('orderCode driverEarning deliveredAt pickup dropoff').lean()
  ]);

  const transactions = [
    ...rides.map((ride) => ({ id: ride._id, code: ride.bookingCode, type: 'Ride', amount: ride.driverEarning, date: ride.completedAt, from: ride.pickup.address, to: ride.dropoff.address })),
    ...orders.map((order) => ({ id: order._id, code: order.orderCode, type: 'Delivery', amount: order.driverEarning, date: order.deliveredAt, from: order.pickup.address, to: order.dropoff.address }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const rideTotal = rides.reduce((sum, ride) => sum + ride.driverEarning, 0);
  const deliveryTotal = orders.reduce((sum, order) => sum + order.driverEarning, 0);
  const total = rideTotal + deliveryTotal;
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const amount = transactions
      .filter((item) => item.date && new Date(item.date) >= date && new Date(item.date) < next)
      .reduce((sum, item) => sum + item.amount, 0);
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en', { weekday: 'short' }), amount };
  });

  res.json({ summary: { total, rideTotal, deliveryTotal, completedJobs: transactions.length, averagePerJob: transactions.length ? total / transactions.length : 0 }, daily, transactions: transactions.slice(0, 100) });
}
