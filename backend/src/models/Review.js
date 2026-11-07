import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    serviceType: { type: String, enum: ['ride', 'delivery'], default: 'ride' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
