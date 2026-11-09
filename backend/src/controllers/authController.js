import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Rider from '../models/Rider.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';

const makeToken = (id, role) => jwt.sign({ sub: String(id), role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicRider = (rider) => ({ _id: rider._id, name: rider.name, email: rider.email, phone: rider.phone, avatar: rider.avatar, studentRegistrationNumber: rider.studentRegistrationNumber || '', createdAt: rider.createdAt });
const normalizePhone = (phone) => String(phone || '').replace(/[\s()-]/g, '');
const validPhone = (phone) => /^\+?[0-9]{7,15}$/.test(phone);

async function registerRiderProfile({ name, email, phone, password, studentRegistrationNumber = '', securityQuestion = null, securityAnswer = '' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);
  if (!String(name || '').trim() || !normalizedEmail || !password) throw Object.assign(new Error('Name, email and password are required.'), { status: 400 });
  if (String(password).length < 6) throw Object.assign(new Error('Password must contain at least 6 characters.'), { status: 400 });
  if (normalizedPhone && !validPhone(normalizedPhone)) throw Object.assign(new Error('Please enter a valid phone number.'), { status: 400 });
  if (await Rider.exists({ email: normalizedEmail }) || await Driver.exists({ email: normalizedEmail }) || await User.exists({ email: normalizedEmail })) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
  if (studentRegistrationNumber && await Rider.exists({ studentRegistrationNumber: String(studentRegistrationNumber).trim() })) throw Object.assign(new Error('Student registration number is already registered.'), { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  const data = { name: String(name).trim(), email: normalizedEmail, phone: normalizedPhone, passwordHash };
  if (studentRegistrationNumber) data.studentRegistrationNumber = String(studentRegistrationNumber).trim();
  if (securityQuestion) data.securityQuestion = securityQuestion;
  if (securityAnswer?.trim()) data.securityAnswerHash = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 12);
  return Rider.create(data);
}

export async function register(req, res) {
  const rider = await registerRiderProfile({ name: req.body.name, email: req.body.email, phone: req.body.phone, password: req.body.password });
  res.status(201).json({ token: makeToken(rider._id, 'rider'), role: 'rider', rider: publicRider(rider) });
}

export async function registerStudent(req, res) {
  const { fullName, email, phoneNumber, password, confirmPassword, studentRegistrationNumber, securityQuestion, securityAnswer } = req.body;
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
  if (!studentRegistrationNumber?.trim() || !securityQuestion || !securityAnswer?.trim()) return res.status(400).json({ message: 'Please complete all required student account fields.' });
  const rider = await registerRiderProfile({ name: fullName, email, phone: phoneNumber, password, studentRegistrationNumber, securityQuestion, securityAnswer });
  res.status(201).json({ message: 'Student account created successfully. You can now sign in.', role: 'rider', rider: publicRider(rider) });
}

export async function registerDriver(req, res) {
  const { fullName, name, email, vehicleNumber, phoneNumber, phone, password, confirmPassword, securityQuestion, securityAnswer, licenseNumber, vehicleType } = req.body;
  if (!String(fullName || name || '').trim() || !String(email || '').trim() || !String(vehicleNumber || '').trim() || !String(phoneNumber || phone || '').trim() || !password) return res.status(400).json({ message: 'Please complete all required driver account fields.' });
  if (password !== confirmPassword && confirmPassword !== undefined) return res.status(400).json({ message: 'Passwords do not match.' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = normalizePhone(phoneNumber || phone);
  if (!validPhone(normalizedPhone)) return res.status(400).json({ message: 'Please enter a valid phone number.' });
  if (await Driver.exists({ email: normalizedEmail }) || await Rider.exists({ email: normalizedEmail }) || await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
  const normalizedVehicle = String(vehicleNumber).trim().toUpperCase();
  if (await Driver.exists({ vehicleNumber: normalizedVehicle })) return res.status(409).json({ message: 'Vehicle number is already registered.' });
  const driver = await Driver.create({
    name: String(fullName || name).trim(), email: normalizedEmail, phone: normalizedPhone,
    password: await bcrypt.hash(password, 12), vehicleNumber: normalizedVehicle,
    vehicleType: vehicleType || 'Three-wheeler', licenseNumber: String(licenseNumber || '').trim(),
    securityQuestion: securityQuestion || null,
    securityAnswerHash: securityAnswer?.trim() ? await bcrypt.hash(securityAnswer.trim().toLowerCase(), 12) : null,
    status: 'offline', documentStatus: 'pending'
  });
  res.status(201).json({ message: 'Driver account created. Your documents can be reviewed by the administrator.', role: 'driver' });
}

async function tryLegacyUserAccount(email, password, wantedRole) {
  const legacy = await User.findOne({ email }).select('+password +passwordHash');
  if (!legacy) return null;
  const legacyRole = legacy.role === 'student' ? 'rider' : (legacy.role === 'rider' || legacy.role === 'driver' ? 'driver' : legacy.role);
  if (legacyRole !== wantedRole || legacy.status === 'suspended') return null;
  const savedPassword = legacy.passwordHash || legacy.password;
  if (!savedPassword || !(await bcrypt.compare(password, savedPassword))) return null;
  if (wantedRole === 'rider') {
    let rider = await Rider.findOne({ email }).select('+passwordHash');
    if (!rider) rider = await Rider.create({ name: legacy.fullName || legacy.name || 'UniRide Student', email, phone: legacy.phoneNumber || legacy.phone || '', passwordHash: savedPassword, studentRegistrationNumber: legacy.studentRegistrationNumber || '' });
    return { profile: rider, role: 'rider' };
  }
  let driver = await Driver.findOne({ email }).select('+password');
  if (!driver) driver = await Driver.create({ name: legacy.fullName || legacy.name || 'UniRide Driver', email, phone: legacy.phoneNumber || legacy.phone || '', password: savedPassword, vehicleNumber: legacy.vehicleNumber || `PENDING-${String(legacy._id).slice(-6)}`, securityQuestion: legacy.securityQuestion || null, securityAnswerHash: legacy.securityAnswerHash || null, status: 'offline', documentStatus: 'pending' });
  return { profile: driver, role: 'driver' };
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role === 'driver' ? 'driver' : 'rider';
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  if (role === 'driver') {
    const driver = await Driver.findOne({ email }).select('+password');
    if (driver && driver.status !== 'suspended' && await bcrypt.compare(password, driver.password)) {
      const safeDriver = await Driver.findById(driver._id);
      return res.json({ token: makeToken(driver._id, 'driver'), role: 'driver', driver: safeDriver });
    }
  } else {
    const rider = await Rider.findOne({ email }).select('+passwordHash');
    if (rider && rider.status !== 'suspended' && await bcrypt.compare(password, rider.passwordHash)) {
      return res.json({ token: makeToken(rider._id, 'rider'), role: 'rider', rider: publicRider(rider) });
    }
  }
  const legacy = await tryLegacyUserAccount(email, password, role);
  if (legacy) {
    if (role === 'driver') return res.json({ token: makeToken(legacy.profile._id, 'driver'), role: 'driver', driver: legacy.profile });
    return res.json({ token: makeToken(legacy.profile._id, 'rider'), role: 'rider', rider: publicRider(legacy.profile) });
  }
  return res.status(401).json({ message: `The ${role} email or password is incorrect.` });
}

export async function me(req, res) {
  if (req.role === 'driver') return res.json({ role: 'driver', driver: req.driver });
  return res.json({ role: 'rider', rider: publicRider(req.rider) });
}

const DEMO_OTP = '123456';
export async function requestPasswordReset(req, res) {
  if (process.env.DEMO_MODE !== 'true') return res.status(503).json({ message: 'Demo password recovery is disabled. Contact the administrator.' });
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await Rider.findOne({ email }) || await Driver.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No account found with this email address.' });
  res.json({ message: 'Demo verification code prepared. No email was sent.' });
}
export async function verifyPasswordReset(req, res) {
  if (process.env.DEMO_MODE !== 'true') return res.status(503).json({ message: 'Demo password recovery is disabled.' });
  const email = String(req.body.email || '').trim().toLowerCase();
  if (String(req.body.code || '').trim() !== DEMO_OTP) return res.status(400).json({ message: 'Incorrect verification code.' });
  const user = await Rider.findOne({ email }) || await Driver.findOne({ email });
  if (!user) return res.status(400).json({ message: 'No account found with this email address.' });
  res.json({ resetToken: jwt.sign({ sub: String(user._id), email, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '10m' }) });
}
export async function resetPassword(req, res) {
  const { resetToken, newPassword, confirmPassword } = req.body;
  if (!resetToken || !newPassword || newPassword !== confirmPassword) return res.status(400).json({ message: 'Please enter matching new passwords.' });
  if (String(newPassword).length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
  let payload;
  try { payload = jwt.verify(resetToken, process.env.JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid or expired reset session.' }); }
  if (payload.purpose !== 'password-reset') return res.status(401).json({ message: 'Invalid password reset token.' });
  const rider = await Rider.findById(payload.sub).select('+passwordHash');
  if (rider) { rider.passwordHash = await bcrypt.hash(newPassword, 12); await rider.save(); return res.json({ message: 'Password reset successfully. Please sign in.' }); }
  const driver = await Driver.findById(payload.sub).select('+password');
  if (driver) { driver.password = await bcrypt.hash(newPassword, 12); await driver.save(); return res.json({ message: 'Password reset successfully. Please sign in.' }); }
  return res.status(404).json({ message: 'Account not found.' });
}
