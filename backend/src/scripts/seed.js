import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import Rider from '../models/Rider.js';
import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';
import { foods, products } from '../data/catalog.js';

const point = (address, lng = 81.856875, lat = 7.300617) => ({ address, coordinates: [lng, lat] });

async function seed() {
  await connectDB();
  let driver = await Driver.findOne({ email: 'kavi@uni.com' });
  if (!driver) {
    driver = await Driver.create({
      name: 'Kavindu Dilshan', email: 'kavi@uni.com', password: await bcrypt.hash('kavi@192', 12),
      phone: '+94 77 234 5678', vehicleType: 'Three Wheeler', vehicleNumber: 'WP CAB-2048', licenseNumber: 'DL-908172', status: 'online', documentStatus: 'approved'
    });
  }
  driver.name = 'Kavindu Dilshan';
  driver.documentStatus = 'approved';
  driver.status = 'online';
  await driver.save();
  let rider = await Rider.findOne({ email: 'net@uni.com' });
  if (!rider) {
    rider = await Rider.create({ name: 'Nethmi Perera', email: 'net@uni.com', phone: '+94 77 345 6789', passwordHash: await bcrypt.hash('net@192', 12) });
  }
  rider.name = 'Nethmi Perera';
  await rider.save();

  if (!(await Ride.exists({ rider: rider._id, status: 'available', driver: null }))) {
    const pickup = point('South Eastern University of Sri Lanka, Oluvil');
    const library = point('Oluvil Public Library, Oluvil', 81.8583, 7.2988);
    const beach = point('Oluvil Beach, Oluvil', 81.8615, 7.2959);
    await Ride.insertMany([
      { bookingCode: 'UR-R-DEMO101', rider: rider._id, passengerName: rider.name, passengerPhone: rider.phone, pickup, destination: library, dropoff: library, rideType: 'Economy', distanceKm: 1.8, durationMin: 7, fare: 480, estimatedFare: 480, driverEarning: 360, status: 'available' },
      { bookingCode: 'UR-R-DEMO102', rider: rider._id, passengerName: rider.name, passengerPhone: rider.phone, pickup, destination: beach, dropoff: beach, rideType: 'Comfort', distanceKm: 2.6, durationMin: 10, fare: 720, estimatedFare: 720, driverEarning: 540, status: 'completed', driver: driver._id, requestedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000 * 2) }
    ]);
  }

  if (!(await DeliveryOrder.exists({ rider: rider._id, status: 'pending', driver: null }))) {
    const food = foods[2];
    const product = products[1];
    const pickupFood = point(food.pickupAddress || food.shop, ...(food.pickupCoordinates || [81.8592, 7.3021]));
    const pickupProduct = point(product.pickupAddress || product.shop, ...(product.pickupCoordinates || [81.8592, 7.3021]));
    const campus = point('South Eastern University of Sri Lanka, Oluvil');
    const makeOrder = (entry, orderType, status, suffix, assignedDriver = null) => ({
      rider: rider._id, orderType, items: [{ itemId: entry._id, name: entry.name, image: entry.image, shop: entry.shop, price: entry.price, quantity: 1 }],
      shop: entry.shop, meal: entry.meal || '', deliveryAddress: campus.address, deliveryCoordinates: campus.coordinates,
      pickupAddress: entry.pickupAddress || entry.shop, pickupCoordinates: orderType === 'food' ? pickupFood.coordinates : pickupProduct.coordinates,
      subtotal: entry.price, deliveryFee: 100, total: entry.price + 100, paymentMethod: 'Cash on delivery',
      receiptNumber: `UR-DEMO-${suffix}`, orderCode: `UR-DEMO-${suffix}`, customerName: rider.name, customerPhone: rider.phone,
      pickup: orderType === 'food' ? pickupFood : pickupProduct, dropoff: campus, packageDescription: `${entry.name} × 1`,
      distanceKm: 1.6, totalAmount: entry.price + 100, driverEarning: 188, status, driver: assignedDriver,
      ...(status === 'delivered' ? { deliveredAt: new Date(Date.now() - 86400000 * 3) } : {})
    });
    await DeliveryOrder.insertMany([
      makeOrder(food, 'food', 'pending', '20101'),
      makeOrder(product, 'product', 'delivered', '20102', driver._id)
    ]);
  }

  await Review.updateMany({ rider: rider._id }, { $set: { customerName: rider.name } });
  const existingReview = await Review.findOne({ driver: driver._id });
  if (!existingReview) {
    const completedRide = await Ride.findOne({ rider: rider._id, status: 'completed', driver: driver._id });
    if (completedRide) await Review.create({ rider: rider._id, driver: driver._id, customerName: rider.name, targetType: 'ride', serviceType: 'ride', targetId: completedRide._id, targetName: `${completedRide.pickup.address} → ${completedRide.destination.address}`, rating: 5, comment: 'Friendly driver and a smooth trip.' });
  }

  console.log('UniRide accounts are ready.');
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
