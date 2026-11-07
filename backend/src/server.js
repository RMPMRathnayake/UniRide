import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'driver-platform-api', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/deliveries', deliveryRoutes);

app.use((_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  if (process.env.NODE_ENV !== 'production') console.error(error);
  res.status(status).json({ message: error.message || 'Something went wrong.' });
});

const port = Number(process.env.PORT || 5000);
connectDB()
  .then(() => app.listen(port, () => console.log(`API running at http://localhost:${port}`)))
  .catch((error) => {
    console.error('Could not start API:', error.message);
    process.exit(1);
  });
