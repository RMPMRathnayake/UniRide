import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
  targetType: { type: String, enum: ['ride', 'delivery'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetName: { type: String, default: '' },
  customerName: { type: String, default: '' },
  serviceType: { type: String, enum: ['ride', 'delivery'], default: 'ride' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000, default: '' }
}, { timestamps: true });

reviewSchema.index({ rider: 1, targetId: 1 }, { unique: true });
export default mongoose.model('Review', reviewSchema);
