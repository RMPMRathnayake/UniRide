import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import { httpError } from '../utils/httpError.js';

function makeToken(driverId) {
  return jwt.sign({ sub: driverId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw httpError(400, 'Email and password are required.');

  const driver = await Driver.findOne({ email }).select('+password');
  if (!driver || !(await bcrypt.compare(password, driver.password))) {
    throw httpError(401, 'The email or password is incorrect.');
  }

  const safeDriver = await Driver.findById(driver._id);
  res.json({ token: makeToken(driver._id.toString()), driver: safeDriver });
}

export async function me(req, res) {
  res.json({ driver: req.driver });
}
