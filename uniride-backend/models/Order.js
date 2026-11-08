import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    storeId: { type: String, default: '' },
    storeName: { type: String, default: '' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
    img: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    txnId: {
      type: String,
      default: '',
    },
    service: {
      type: String,
      default: 'uniEats',
    },
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      default: 'UniEats Partner Store',
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    promotion: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 99,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    dropoffMethod: {
      type: String,
      default: 'Meet at my door',
    },
    deliveryInstructions: {
      type: String,
      default: '',
    },
    deliveryOptionType: {
      type: String,
      default: 'standard',
    },
    paymentMethod: {
      type: String,
      default: 'Card',
    },
    status: {
      type: String,
      enum: ['Created', 'Preparing', 'Picked Up', 'Delivered', 'PAID'],
      default: 'PAID',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
