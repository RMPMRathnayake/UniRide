import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import conciergeRoutes from './routes/conciergeRoutes.js';
import { getAppMeta } from './controllers/storeController.js';
import { seedDatabase } from './seedData.js';
import Store from './models/Store.js';
import Product from './models/Product.js';
import Rider from './models/Rider.js';
import Location from './models/Location.js';
import Order from './models/Order.js';
import Cart from './models/Cart.js';
import DiscoveredShop from './models/DiscoveredShop.js';
import MasterCatalogItem from './models/MasterCatalogItem.js';
import ConciergeOrder from './models/ConciergeOrder.js';
import SettlementLedger from './models/SettlementLedger.js';

// Load .env file automatically if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equals = trimmed.indexOf('=');
    if (equals < 1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  console.log('Loaded environment settings from:', envPath);
} else {
  console.log('No .env file found; using process environment and local defaults.');
}

export const app = express();
const PORT = Number(process.env.PORT || 5000);
let activeMongoMode = 'initializing';

app.use(cors());
// Allow JSON bodies up to 8 MB so base64 receipt images up to 5 MB can be validated
app.use(express.json({ limit: '8mb' }));

// Mount Modular API Routers
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/concierge', conciergeRoutes);
app.get('/api/meta', getAppMeta);

// Connection state and stored data are checked separately.
app.get('/api/health', async (_req, res) => {
  const connection = mongoose.connection;
  if (connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      backendConnected: true,
      mongodb: { connected: false, mode: activeMongoMode },
    });
  }

  try {
    await connection.db.admin().ping();
    const models = [
      Store,
      Product,
      Rider,
      Location,
      Order,
      Cart,
      DiscoveredShop,
      MasterCatalogItem,
      ConciergeOrder,
      SettlementLedger,
    ];
    const entries = await Promise.all(
      models.map(async (Model) => [
        Model.collection.name,
        await Model.countDocuments(),
      ])
    );
    return res.json({
      success: true,
      service: 'uniEats Express + Mongoose Backend',
      backendConnected: true,
      mongodb: {
        connected: true,
        mode: activeMongoMode,
        database: connection.name,
        host: connection.host,
        port: connection.port,
      },
      collections: Object.fromEntries(entries),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      backendConnected: true,
      mongodb: {
        connected: connection.readyState === 1,
        database: connection.name,
      },
      message: 'MongoDB ping or collection count failed',
      error: error.message,
    });
  }
});

// Use the configured persistent MongoDB server. No temporary in-memory fallback.
export async function startServer() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniEatsDB';

  try {
    // Connect to the configured MongoDB server.
    // A failure stops startup instead of switching databases.
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    // Confirm MongoDB responds to a command.
    await mongoose.connection.db.admin().ping();

    const connection = mongoose.connection;

    activeMongoMode =
      connection.host === '127.0.0.1' || connection.host === 'localhost'
        ? 'Local MongoDB Community Server'
        : 'Configured MongoDB server';

    console.log('MongoDB connected successfully');
    console.log('Host:', connection.host);
    console.log('Port:', connection.port);
    console.log('Database:', connection.name);

    // Seed missing sample records & concierge templates without clearing existing data.
    await seedDatabase();

    if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error('PORT must be an integer from 1 to 65535');
    }
    const server = app.listen(PORT, () => {
      console.log(`Express server: http://localhost:${PORT}`);
      console.log(`Connection check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error) => {
      console.error('Express could not start:', error.message);
      process.exit(1);
    });

    return server;
  } catch (error) {
    activeMongoMode = 'Disconnected';

    console.error(
      'Backend startup failed (connection or data initialization):',
      error.message
    );

    console.error(
      'Check that MongoDB is running and MONGO_URI matches your Compass connection.'
    );

    process.exit(1);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain && process.env.UNI_SKIP_AUTO_START !== 'true') {
  startServer();
}
