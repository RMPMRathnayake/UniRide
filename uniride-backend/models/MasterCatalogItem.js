import mongoose from 'mongoose';

const masterCatalogItemSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['stationery', 'grocery'],
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    unitLabel: {
      type: String,
      default: '1 unit',
    },
    // Stored in LKR integer minor units (cents, e.g. 25000 = LKR 250.00)
    estimatedUnitPriceMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'estimatedUnitPriceMinor must be an integer in LKR minor units (cents).',
      },
    },
    // Templates are generic shopping guides, NEVER verified merchant inventory
    isVerifiedInventory: {
      type: Boolean,
      default: false,
    },
    priceLabel: {
      type: String,
      default: 'Estimated price',
    },
    availabilityLabel: {
      type: String,
      default: 'Availability confirmed by rider',
    },
    imageLabel: {
      type: String,
      default: 'Illustrative image',
    },
    illustrativeImageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MasterCatalogItem =
  mongoose.models.MasterCatalogItem ||
  mongoose.model('MasterCatalogItem', masterCatalogItemSchema);

export default MasterCatalogItem;
