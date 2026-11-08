import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      default: 'grocery',
      index: true,
    },
    templateKey: {
      type: String,
      required: true,
      index: true,
    },
    priceFactor: {
      type: Number,
      default: 1.0,
    },
    dLat: {
      type: Number,
      default: 0.008,
    },
    dLng: {
      type: Number,
      default: 0.006,
    },
    location: {
      dLat: { type: Number, default: 0.008 },
      dLng: { type: Number, default: 0.006 },
      streetAddress: { type: String, default: '' },
    },
    eta: {
      type: String,
      default: '30 min',
    },
    timeSlot: {
      type: String,
      default: null,
    },
    saleBadge: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 99,
    },
    streetAddress: {
      type: String,
      default: '',
    },
    menuTitle: {
      type: String,
      default: 'Menu',
    },
    menuHours: {
      type: String,
      default: '8:00 AM – 10:00 PM',
    },
    menuSections: {
      type: [String],
      default: ['Featured items', 'Picked for you'],
    },
    logoBg: {
      type: String,
      default: '#111111',
    },
    logoImg: {
      type: String,
      default: '',
    },
    bannerImg: {
      type: String,
      default: '',
    },
    bannerOverlayTitle: {
      type: String,
      default: null,
    },
    storeType: {
      type: String,
      enum: ['partner', 'independent_osm', 'demonstration'],
      default: 'demonstration',
      index: true,
    },
    isIndependent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);

export default Store;
