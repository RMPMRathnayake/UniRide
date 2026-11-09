import mongoose from 'mongoose';
const auditLogSchema = new mongoose.Schema({
  actor: { type: String, default: 'Admin' }, action: { type: String, required: true }, target: { type: String, default: '' },
  details: { type: String, default: '' }, ip: { type: String, default: '' }
}, { timestamps: true });
export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
