import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  studentRegistrationNumber: { type: String, trim: true, sparse: true },
  securityQuestion: { type: String, default: null },
  securityAnswerHash: { type: String, default: null, select: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true }
}, { timestamps: true });

riderSchema.set('toJSON', { transform: (_doc, ret) => { delete ret.passwordHash; delete ret.securityAnswerHash; delete ret.__v; return ret; } });
export default mongoose.model('Rider', riderSchema);
