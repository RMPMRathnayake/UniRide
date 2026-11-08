import mongoose from 'mongoose';

const discoveryCacheSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    bucketKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    centerLat: {
      type: Number,
      required: true,
    },
    centerLng: {
      type: Number,
      required: true,
    },
    fetchedRadiusMeters: {
      type: Number,
      required: true,
    },
    shopExternalIds: {
      type: [String],
      default: [],
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const DiscoveryCache =
  mongoose.models.DiscoveryCache ||
  mongoose.model('DiscoveryCache', discoveryCacheSchema);

export default DiscoveryCache;
