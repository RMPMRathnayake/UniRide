import mongoose from 'mongoose';
const pricingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  baseFare: { type: Number, min: 0, default: 100 },
  perKmRate: { type: Number, min: 0, default: 50 },
  deliverySurcharge: { type: Number, min: 0, default: 100 },
  updatedBy: { type: String, default: '' }
}, { timestamps: true });
export default mongoose.models.Pricing || mongoose.model('Pricing', pricingSchema);
