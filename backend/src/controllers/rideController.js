import Ride from '../models/Ride.js';
import Pricing from '../models/Pricing.js';
import { httpError } from '../utils/httpError.js';

const rideMultipliers = { Bike: 0.85, 'Three Wheeler': 1, Economy: 1, Comfort: 1.35, XL: 1.7 };
const validPoint = (point) => Boolean(point?.address?.trim()) && Array.isArray(point.coordinates) && point.coordinates.length === 2 && point.coordinates.every((value) => Number.isFinite(Number(value)));
const publicDriver = (driver) => driver ? ({ name: driver.name, phone: driver.phone, vehicle: `${driver.vehicleType || 'Vehicle'} · ${driver.vehicleNumber || ''}`.trim() }) : null;

// Rider side: every booking is written to the same Ride collection that drivers query.
export async function listRiderRides(req, res) {
  const scope = req.query.scope || 'all';
  const filter = { rider: req.rider._id };
  if (scope === 'active') filter.status = { $in: ['available', 'accepted', 'in_progress'] };
  if (scope === 'completed') filter.status = 'completed';
  if (scope === 'cancelled') filter.status = 'cancelled';
  const rides = await Ride.find(filter).populate('driver').sort({ createdAt: -1 }).lean();
  res.json({ rides: rides.map((ride) => ({ ...ride, driver: publicDriver(ride.driver), destination: ride.destination || ride.dropoff, fare: ride.fare ?? ride.estimatedFare })) });
}

export async function createRiderRide(req, res) {
  const { pickup, destination, rideType = 'Bike', distanceKm = 0, durationMin = 0, paymentMethod = 'Cash' } = req.body;
  if (!validPoint(pickup) || !validPoint(destination)) return res.status(400).json({ message: 'Choose valid pickup and destination locations.' });
  if (!rideMultipliers[rideType]) return res.status(400).json({ message: 'Choose a valid ride type.' });
  const distance = Number(distanceKm);
  const duration = Number(durationMin);
  if (!Number.isFinite(distance) || distance <= 0 || distance > 1000 || !Number.isFinite(duration) || duration < 0 || duration > 3000) return res.status(400).json({ message: 'Trip distance or duration is invalid.' });

  const pricing = await Pricing.findOne({ key: 'global' }).lean();
  const baseFare = Number(pricing?.baseFare ?? 100);
  const perKmRate = Number(pricing?.perKmRate ?? 50);
  const fare = Math.round((baseFare + Math.max(distance, 0.8) * perKmRate) * rideMultipliers[rideType]);
  const bookingCode = `UR-R-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
  const ride = await Ride.create({
    bookingCode, rider: req.rider._id, passengerName: req.rider.name, passengerPhone: req.rider.phone || '',
    pickup, destination, dropoff: destination, rideType, distanceKm: distance, durationMin: duration,
    fare, estimatedFare: fare, driverEarning: Math.round(fare * 0.75),
    paymentMethod: ['Cash', 'Card', 'Wallet'].includes(paymentMethod) ? paymentMethod : 'Cash', status: 'available'
  });
  res.status(201).json({ message: 'Ride request placed. It is now visible to available drivers.', ride });
}

export async function cancelRiderRide(req, res) {
  const ride = await Ride.findOne({ _id: req.params.id, rider: req.rider._id });
  if (!ride) return res.status(404).json({ message: 'Ride not found.' });
  if (ride.status !== 'available') return res.status(409).json({ message: 'A ride can only be cancelled before a driver accepts it.' });
  ride.status = 'cancelled';
  await ride.save();
  res.json({ message: 'Ride request cancelled.', ride });
}

// Driver side: job lists and state transitions operate on those same rider-created records.
export async function listDriverRides(req, res) {
  const scope = req.query.scope || 'available';
  const filters = {
    available: { status: { $in: ['available', 'searching'] }, driver: null },
    active: { driver: req.driver._id, status: { $in: ['accepted', 'in_progress', 'driver_assigned'] } },
    completed: { driver: req.driver._id, status: 'completed' }
  };
  if (!filters[scope]) throw httpError(400, 'Unknown ride scope.');
  const rides = await Ride.find(filters[scope]).sort({ requestedAt: scope === 'completed' ? -1 : 1 }).limit(100);
  res.json({ rides: rides.map((ride) => {
    const row = ride.toObject();
    row.dropoff = row.dropoff || row.destination;
    row.estimatedFare = row.estimatedFare || row.fare;
    row.bookingCode = row.bookingCode || `RIDE-${String(row._id).slice(-6).toUpperCase()}`;
    return row;
  }) });
}

export async function acceptRide(req, res) {
  if (req.driver.documentStatus !== 'approved') throw httpError(403, 'Your driver account must be approved by an administrator before accepting jobs.');
  if (req.driver.status !== 'online') throw httpError(403, 'Set your availability to Available before accepting a new job.');
  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ['available', 'searching'] }, driver: null },
    { $set: { status: 'accepted', driver: req.driver._id, acceptedAt: new Date() } },
    { new: true }
  );
  if (!ride) throw httpError(409, 'This ride is no longer available. Refresh the list and try another ride.');
  res.json({ message: 'Ride accepted.', ride });
}

export async function updateDriverRideStatus(req, res) {
  const { status } = req.body;
  const transitions = { in_progress: ['accepted', 'driver_assigned'], completed: ['in_progress'] };
  if (!transitions[status]) throw httpError(400, 'Invalid ride status transition.');
  const update = { status };
  if (status === 'in_progress') update.startedAt = new Date();
  if (status === 'completed') update.completedAt = new Date();
  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, driver: req.driver._id, status: { $in: transitions[status] } },
    { $set: update }, { new: true }
  );
  if (!ride) throw httpError(409, 'Ride status could not be updated. Refresh and check its current status.');
  res.json({ message: `Ride marked ${status.replace('_', ' ')}.`, ride });
}
