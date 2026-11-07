import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Review from '../models/Review.js';

const point = (address, lng, lat) => ({ address, coordinates: [lng, lat] });

async function seed() {
  await connectDB();
  const email = 'driver@uniride.com';
  let driver = await Driver.findOne({ email });
  if (!driver) {
    driver = await Driver.create({
      name: 'Dimuthu Dilshan', email, password: await bcrypt.hash('dimuthu@192', 12),
      phone: '+94 725 570 752', vehicleType: 'Three Wheel', vehicleNumber: 'DRL-2048', licenseNumber: 'DL-908172', status: 'online'
    });
  }

  const campus = {
    library: point('South Eastern University Main Library, University Park, Oluvil', 81.85651, 7.30131),
    admin: point('Admin Building, South Eastern University, Oluvil', 81.85529, 7.30109),
    arts: point('Faculty of Arts and Culture, South Eastern University, Oluvil', 81.86074, 7.29929),
    technology: point('Faculty of Technology, South Eastern University, Oluvil', 81.86068, 7.29783),
    recreation: point('Students Recreation Centre, South Eastern University, Oluvil', 81.86174, 7.29759),
    boysHostel: point('Boys Hostel Villa 1, South Eastern University, Oluvil', 81.86198, 7.29933),
    girlsHostel: point('Villa 1 Girls Hostel, South Eastern University, Oluvil', 81.8558, 7.30255),
    campus: point('South Eastern University Main Campus, Oluvil', 81.85652, 7.3004),
    ground: point('SEUSL Ground 2, South Eastern University, Oluvil', 81.85643, 7.29898)
  };

  const rides = [
    {
      bookingCode: 'RIDE-10482', passengerName: 'Kavindu Perera', passengerPhone: '+94 768 541 210',
      pickup: campus.library, dropoff: campus.arts, distanceKm: 1.2, estimatedFare: 120, driverEarning: 100,
      paymentMethod: 'Card', status: 'available'
    },
    {
      bookingCode: 'RIDE-10483', passengerName: 'Tharushi Fernando', passengerPhone: '+94 752 154 201',
      pickup: campus.admin, dropoff: campus.recreation, distanceKm: 1.1, estimatedFare: 100, driverEarning: 85,
      paymentMethod: 'Cash', status: 'available'
    },
    {
      bookingCode: 'RIDE-10484', passengerName: 'Mohamed Rizwan', passengerPhone: '+94 761 200 154',
      pickup: campus.boysHostel, dropoff: campus.technology, distanceKm: 1.4, estimatedFare: 140, driverEarning: 115,
      paymentMethod: 'Wallet', status: 'accepted', driver: driver._id, acceptedAt: new Date()
    },
    {
      bookingCode: 'RIDE-10412', passengerName: 'Fathima Nazeera', passengerPhone: '+94 721 254 874',
      pickup: campus.arts, dropoff: campus.library, distanceKm: 1.2, estimatedFare: 120, driverEarning: 100,
      paymentMethod: 'Card', status: 'completed', driver: driver._id,
      requestedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000 * 2)
    }
  ];

  await Ride.bulkWrite(rides.map((ride) => {
    const { bookingCode, pickup, dropoff, distanceKm, estimatedFare, driverEarning, ...insertFields } = ride;
    return {
      updateOne: {
        filter: { bookingCode },
        update: {
          $set: { pickup, dropoff, distanceKm, estimatedFare, driverEarning },
          $setOnInsert: { bookingCode, ...insertFields }
        },
        upsert: true
      }
    };
  }));

  const orders = [
    {
      orderCode: 'ORD-78231', customerName: 'Fathima Nazeera', customerPhone: '+94 721 254 874',
      pickup: campus.library, dropoff: campus.admin, items: [{ name: 'Grocery bag', quantity: 2 }, { name: 'Fresh bread', quantity: 1 }],
      packageDescription: 'Grocery delivery', distanceKm: 1.4, totalAmount: 2400, driverEarning: 150,
      paymentMethod: 'Card', status: 'pending'
    },
    {
      orderCode: 'ORD-78232', customerName: 'Mohamed Rizwan', customerPhone: '+94 761 200 154',
      pickup: campus.arts, dropoff: campus.library, items: [{ name: 'Clothing parcel', quantity: 1 }],
      packageDescription: 'Small parcel', distanceKm: 1.2, totalAmount: 3500, driverEarning: 150,
      paymentMethod: 'Cash', status: 'pending'
    },
    {
      orderCode: 'ORD-78233', customerName: 'Tharushi Fernando', customerPhone: '+94 752 154 201',
      pickup: campus.girlsHostel, dropoff: campus.recreation, items: [{ name: 'Meal box', quantity: 1 }],
      packageDescription: 'Food delivery', distanceKm: 1.7, totalAmount: 1800, driverEarning: 150,
      paymentMethod: 'Cash', status: 'picked_up', driver: driver._id, acceptedAt: new Date(), pickedUpAt: new Date()
    },
    {
      orderCode: 'ORD-78190', customerName: 'Kavindu Perera', customerPhone: '+94 768 541 210',
      pickup: campus.technology, dropoff: campus.ground, items: [{ name: 'Office supplies', quantity: 2 }],
      packageDescription: 'Office supplies', distanceKm: 0.8, totalAmount: 2200, driverEarning: 150,
      paymentMethod: 'Card', status: 'delivered', driver: driver._id,
      requestedAt: new Date(Date.now() - 86400000 * 3), deliveredAt: new Date(Date.now() - 86400000 * 3)
    }
  ];

  await DeliveryOrder.bulkWrite(orders.map((order) => {
    const { orderCode, pickup, dropoff, distanceKm, totalAmount, driverEarning, ...insertFields } = order;
    return {
      updateOne: {
        filter: { orderCode },
        update: {
          $set: { pickup, dropoff, distanceKm, totalAmount, driverEarning },
          $setOnInsert: { orderCode, ...insertFields }
        },
        upsert: true
      }
    };
  }));

  const reviews = [
    { customerName: 'Kavindu Perera', rating: 5, comment: 'Very friendly and arrived right on time. The ride was smooth.', serviceType: 'ride', createdAt: new Date(Date.now() - 86400000) },
    { customerName: 'Fathima Nazeera', rating: 5, comment: 'Package was handled carefully and delivered quickly.', serviceType: 'delivery', createdAt: new Date(Date.now() - 86400000 * 2) },
    { customerName: 'Tharushi Fernando', rating: 4, comment: 'Good communication and a comfortable trip.', serviceType: 'ride', createdAt: new Date(Date.now() - 86400000 * 4) },
    { customerName: 'Mohamed Rizwan', rating: 5, comment: 'Excellent service. Thank you!', serviceType: 'delivery', createdAt: new Date(Date.now() - 86400000 * 5) }
  ];

  await Promise.all(reviews.map((review) => Review.findOneAndUpdate(
    { driver: driver._id, comment: review.comment },
    { $set: { customerName: review.customerName, rating: review.rating, serviceType: review.serviceType }, $setOnInsert: { createdAt: review.createdAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  console.log('\ndata ready.');
  console.log('Email: driver@uniride.com');
  console.log('Password: dimuthu@192\n');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
