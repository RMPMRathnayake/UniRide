import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  address: { type: String, required: true, trim: true },
  // GeoJSON coordinate order: [longitude, latitude].
  coordinates: {
    type: [Number], required: true,
    validate: { validator: (value) => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite), message: 'Coordinates must be [longitude, latitude].' }
  }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true, sparse: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', index: true },
  passengerName: { type: String, default: 'Passenger' },
  passengerPhone: { type: String, default: '' },
  pickup: { type: placeSchema, required: true },
  // destination is retained for the rider interface; dropoff is used by the driver interface.
  destination: { type: placeSchema, required: true },
  dropoff: { type: placeSchema, required: true },
  rideType: { type: String, enum: ['Bike', 'Three Wheeler', 'Economy', 'Comfort', 'XL'], default: 'Bike' },
  distanceKm: { type: Number, default: 0, min: 0 },
  durationMin: { type: Number, default: 0, min: 0 },
  fare: { type: Number, default: 0, min: 0 },
  estimatedFare: { type: Number, default: 0, min: 0 },
  driverEarning: { type: Number, default: 0, min: 0 },
  paymentMethod: { type: String, default: 'Cash' },
  status: { type: String, enum: ['available', 'accepted', 'in_progress', 'completed', 'cancelled', 'searching', 'driver_assigned'], default: 'available', index: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
  requestedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, maxlength: 1000, default: '' }
}, { timestamps: true });

rideSchema.index({ driver: 1, status: 1 });
export default mongoose.model('Ride', rideSchema);
