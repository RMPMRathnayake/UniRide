import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function adminLogin(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  const user = await User.findOne({ email, role: 'admin' }).select('+passwordHash +password');
  const savedPassword = user?.passwordHash || user?.password;
  if (!user || user.status !== 'active' || !savedPassword || !(await bcrypt.compare(password, savedPassword))) return res.status(401).json({ message: 'Invalid administrator credentials.' });
  const token = jwt.sign({ sub: user._id.toString(), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: { id: user._id, name: user.name || user.fullName, email: user.email, role: 'admin' } });
}
export async function adminMe(req, res) {
  res.json({ user: { id: req.user._id, name: req.user.name || req.user.fullName, email: req.user.email, role: 'admin' } });
}
