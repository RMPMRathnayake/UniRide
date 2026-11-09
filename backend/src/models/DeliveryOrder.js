import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  address: { type: String, required: true, trim: true },
  coordinates: { type: [Number], required: true, validate: (value) => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  itemId: { type: String, default: '' }, name: { type: String, required: true }, image: { type: String, default: '' },
  shop: { type: String, default: '' }, price: { type: Number, default: 0 }, quantity: { type: Number, min: 1, default: 1 }
}, { _id: false });

const deliveryOrderSchema = new mongoose.Schema({
  // Rider-side order information.
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
  orderType: { type: String, enum: ['product', 'food'], required: true },
  items: { type: [itemSchema], default: [] },
  shop: { type: String, required: true }, meal: { type: String, default: '' },
  deliveryAddress: { type: String, required: true }, deliveryCoordinates: { type: [Number], default: [] },
  pickupAddress: { type: String, default: '' }, pickupCoordinates: { type: [Number], default: [] },
  subtotal: { type: Number, required: true, min: 0 }, deliveryFee: { type: Number, default: 100, min: 0 }, total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: 'Cash on delivery' }, receiptNumber: { type: String, unique: true, sparse: true },

  // Driver-side job information. These fields reference the same order record above.
  orderCode: { type: String, unique: true, sparse: true }, customerName: { type: String, default: 'Customer' }, customerPhone: { type: String, default: '' },
  pickup: { type: placeSchema, required: true }, dropoff: { type: placeSchema, required: true },
  packageDescription: { type: String, default: 'Delivery order' }, distanceKm: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 }, driverEarning: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'], default: 'pending', index: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
  requestedAt: { type: Date, default: Date.now }, acceptedAt: Date, pickedUpAt: Date, deliveredAt: Date,
  rating: { type: Number, min: 1, max: 5 }, review: { type: String, maxlength: 1000, default: '' }
}, { timestamps: true });

deliveryOrderSchema.index({ driver: 1, status: 1 });
export default mongoose.model('DeliveryOrder', deliveryOrderSchema);
