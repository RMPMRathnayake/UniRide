import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    // GeoJSON order: [longitude, latitude]
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

const rideSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    passengerName: { type: String, required: true },
    passengerPhone: { type: String, default: '' },
    pickup: { type: placeSchema, required: true },
    dropoff: { type: placeSchema, required: true },
    distanceKm: { type: Number, default: 0 },
    estimatedFare: { type: Number, required: true, min: 0 },
    driverEarning: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'Wallet'], default: 'Cash' },
    status: {
      type: String,
      enum: ['available', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'available',
      index: true
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Ride', rideSchema);
