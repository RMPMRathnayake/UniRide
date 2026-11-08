import mongoose from 'mongoose';

const discoveredShopSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    osmType: {
      type: String,
      enum: ['node', 'way', 'relation'],
      required: true,
    },
    osmId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    altNames: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ['food', 'grocery', 'stationery', 'pharmacy'],
      required: true,
      index: true,
    },
    osmSubcategory: {
      type: String,
      default: '',
    },
    // GeoJSON Point: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              Number.isFinite(coords[0]) &&
              Number.isFinite(coords[1]) &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'GeoJSON coordinates must be [longitude, latitude] within valid bounds.',
        },
      },
    },
    locationAccuracy: {
      type: String,
      enum: ['node', 'approximate_center'],
      default: 'node',
    },
    coordinatesApprox: {
      type: Boolean,
      default: false,
    },
    address: {
      houseNumber: { type: String, default: null },
      street: { type: String, default: null },
      city: { type: String, default: null },
      postcode: { type: String, default: null },
      formatted: { type: String, default: null },
    },
    contact: {
      phone: { type: String, default: null },
      website: { type: String, default: null },
      email: { type: String, default: null },
    },
    openingHours: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      default: 'openstreetmap_overpass',
      index: true,
    },
    attribution: {
      type: String,
      default: '© OpenStreetMap contributors',
    },
    attributionUrl: {
      type: String,
      default: 'https://www.openstreetmap.org/copyright',
    },
    storeType: {
      type: String,
      enum: ['independent_osm', 'partner', 'demonstration'],
      default: 'independent_osm',
    },
    isIndependent: {
      type: Boolean,
      default: true,
    },
    conciergeNotice: {
      type: String,
      default:
        'An independent rider shops here on your behalf. Prices and availability are confirmed before purchase.',
    },
    rawOsmTags: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

discoveredShopSchema.index({ location: '2dsphere' });

const DiscoveredShop =
  mongoose.models.DiscoveredShop ||
  mongoose.model('DiscoveredShop', discoveredShopSchema);

export default DiscoveredShop;
