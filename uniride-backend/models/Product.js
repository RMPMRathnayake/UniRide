import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
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
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'grocery',
      index: true,
    },
    templateKey: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    tag: {
      type: String,
      required: true,
      index: true,
    },
    rankBadge: {
      type: String,
      default: null,
    },
    likesPct: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },
    likesCount: {
      type: Number,
      default: 100,
    },
    desc: {
      type: String,
      default: '',
    },
    img: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
