import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const driver = await Driver.findById(payload.sub);
    if (!driver) return res.status(401).json({ message: 'Driver account not found.' });
    req.driver = driver;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Your session is invalid or has expired. Please sign in again.' });
  }
}
