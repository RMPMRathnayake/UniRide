import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    securityQuestion: { type: String, default: null },
    securityAnswerHash: { type: String, default: null, select: false },
    avatarUrl: { type: String, default: '' },
    vehicleType: { type: String, default: 'Car' },
    vehicleNumber: { type: String, default: 'ABC-1234' },
    licenseNumber: { type: String, default: 'DRV-000000' },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    documentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, default: '' },
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

driverSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.securityAnswerHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Driver', driverSchema);
