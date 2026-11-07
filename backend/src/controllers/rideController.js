import Ride from '../models/Ride.js';
import { httpError } from '../utils/httpError.js';

export async function listRides(req, res) {
  const scope = req.query.scope || 'available';
  const filters = {
    available: { status: 'available', driver: null },
    active: { driver: req.driver._id, status: { $in: ['accepted', 'in_progress'] } },
    completed: { driver: req.driver._id, status: 'completed' }
  };
  if (!filters[scope]) throw httpError(400, 'Unknown ride scope.');
  const rides = await Ride.find(filters[scope]).sort({ requestedAt: scope === 'completed' ? -1 : 1 }).limit(100);
  res.json({ rides });
}

export async function acceptRide(req, res) {
  if (req.driver.status !== 'online') throw httpError(403, 'Set your status to Available before accepting a new job.');
  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, status: 'available', driver: null },
    { $set: { status: 'accepted', driver: req.driver._id, acceptedAt: new Date() } },
    { new: true }
  );
  if (!ride) throw httpError(409, 'This ride is no longer available. Refresh the list and try another ride.');
  res.json({ message: 'Ride accepted.', ride });
}

export async function updateRideStatus(req, res) {
  const { status } = req.body;
  const transitions = { in_progress: ['accepted'], completed: ['in_progress'] };
  if (!transitions[status]) throw httpError(400, 'Invalid ride status transition.');
  const update = { status };
  if (status === 'in_progress') update.startedAt = new Date();
  if (status === 'completed') update.completedAt = new Date();

  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, driver: req.driver._id, status: { $in: transitions[status] } },
    { $set: update },
    { new: true }
  );
  if (!ride) throw httpError(409, 'Ride status could not be updated. Refresh and check its current status.');
  res.json({ message: `Ride marked ${status.replace('_', ' ')}.`, ride });
}
