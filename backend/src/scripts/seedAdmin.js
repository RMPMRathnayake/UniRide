import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const name = String(process.env.ADMIN_NAME || 'UniRide Administrator').trim();

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Set MONGODB_URI and JWT_SECRET in backend/.env first.');
  process.exit(1);
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Set a valid ADMIN_EMAIL in backend/.env.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Set an ADMIN_PASSWORD of at least 12 characters in backend/.env.');
  process.exit(1);
}

try {
  await connectDB();

  // Hash every time so rerunning `npm run seed:admin` also resets the admin password.
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email }).select('+passwordHash +password');

  if (existing && existing.role !== 'admin') {
    throw new Error(
      `The email ${email} is already used by a ${existing.role} account. ` +
      'Choose a different ADMIN_EMAIL; this script will not promote a student or driver account.'
    );
  }

  if (existing) {
    existing.name = name || 'UniRide Administrator';
    existing.passwordHash = passwordHash;
    existing.password = undefined;
    existing.role = 'admin';
    existing.status = 'active';
    await existing.save();
    console.log(`Administrator account updated and activated: ${email}`);
  } else {
    await User.create({
      name: name || 'UniRide Administrator',
      email,
      passwordHash,
      role: 'admin',
      status: 'active'
    });
    console.log(`Administrator account created: ${email}`);
  }

  console.log('Use the exact ADMIN_EMAIL and ADMIN_PASSWORD values from backend/.env to sign in at /admin/login.');
} catch (error) {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
