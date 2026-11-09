import jwt from 'jsonwebtoken';
import Rider from '../models/Rider.js';
import Driver from '../models/Driver.js';

export default async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const role = payload.role || (payload.sub ? 'driver' : 'rider');
    const id = payload.sub || payload.id;
    if (!id || !['rider', 'driver'].includes(role)) return res.status(401).json({ message: 'Your session is invalid. Please sign in again.' });
    if (role === 'driver') {
      const driver = await Driver.findById(id);
      if (!driver) return res.status(401).json({ message: 'Driver account not found.' });
      if (driver.status === 'suspended') return res.status(403).json({ message: 'This driver account has been suspended. Contact the administrator.' });
      req.driver = driver;
    } else {
      const rider = await Rider.findById(id);
      if (!rider) return res.status(401).json({ message: 'Rider account not found.' });
      if (rider.status === 'suspended') return res.status(403).json({ message: 'This student account has been suspended. Contact the administrator.' });
      req.rider = rider;
    }
    req.role = role;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or has expired. Please sign in again.' });
  }
}

export function requireRole(role) {
  return (req, res, next) => req.role === role ? next() : res.status(403).json({ message: `This action is available to ${role} accounts only.` });
}
