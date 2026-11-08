import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      default: 'UniRide Express Scooter',
    },
    phone: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 0,
      max: 5,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: 'Verified Rider',
    },
    // --- Concierge & Student Rider Dispatch Extensions ---
    isOnline: {
      type: Boolean,
      default: true,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Enforces at most ONE active shopping assignment per rider
    activeOrderId: {
      type: String,
      default: null,
      index: true,
    },
    // GeoJSON [longitude, latitude] around SEUSL Oluvil by default
    lastKnownLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [81.8505, 7.2975],
      },
    },
    lastLocationUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    // Demonstration ledger credit (minor units). Distinct from physical shop cash.
    demoLedgerBalanceMinor: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

riderSchema.index({ lastKnownLocation: '2dsphere' });

const Rider = mongoose.models.Rider || mongoose.model('Rider', riderSchema);

export default Rider;
