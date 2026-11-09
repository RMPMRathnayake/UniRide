import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import orderRoutes from './routes/deliveryRoutes.js';
import driverDeliveryRoutes from './routes/driverDeliveryRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import geocodingRoutes from './routes/geocodingRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/', (_req, res) => res.json({ message: 'Welcome to UniRide API', status: 'running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'uniride-api', timestamp: new Date().toISOString() }));
// Mount the specific administrator auth route before the general auth router.
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', driverDeliveryRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/pricing', pricingRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` }));
app.use((error, _req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'A record with those details already exists.' });
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message || 'Server error.' });
});

const port = Number(process.env.PORT || 5000);
connectDB().then(() => app.listen(port, () => console.log(`UniRide API listening at http://localhost:${port}`))).catch((error) => {
  console.error('Database connection failed:', error.message);
  process.exit(1);
});
