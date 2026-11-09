import mongoose from 'mongoose';

// The User collection is reserved for administrator identities and legacy
// account records from the original login module. Student and driver service
// profiles remain in Rider and Driver so the booking API keeps one source of truth.
const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  fullName: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  password: { type: String, select: false },
  role: { type: String, enum: ['admin', 'student', 'rider', 'driver'], default: 'admin', index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  phone: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  studentRegistrationNumber: { type: String, trim: true, sparse: true },
  vehicleNumber: { type: String, trim: true, sparse: true },
  securityQuestion: { type: String, default: null },
  securityAnswerHash: { type: String, select: false, default: null }
}, { timestamps: true, collection: 'users' });

userSchema.set('toJSON', { transform: (_doc, ret) => { delete ret.password; delete ret.passwordHash; delete ret.securityAnswerHash; delete ret.__v; return ret; } });
export default mongoose.models.User || mongoose.model('User', userSchema);
