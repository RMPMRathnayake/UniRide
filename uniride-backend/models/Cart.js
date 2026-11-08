import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    storeId: { type: String, default: '' },
    storeName: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    storeLogo: { type: String, default: '' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
    img: { type: String, default: '' },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
