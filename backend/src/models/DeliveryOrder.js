import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite),
        message: 'Coordinates must be [longitude, latitude].'
      }
    }
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, min: 1, default: 1 }
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    pickup: { type: placeSchema, required: true },
    dropoff: { type: placeSchema, required: true },
    items: { type: [itemSchema], default: [] },
    packageDescription: { type: String, default: 'Package' },
    distanceKm: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    driverEarning: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'Wallet'], default: 'Cash' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date
  },
  { timestamps: true }
);

deliverySchema.index({ driver: 1, status: 1 });
export default mongoose.model('DeliveryOrder', deliverySchema);
