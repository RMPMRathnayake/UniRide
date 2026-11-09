import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true }, message: { type: String, default: '' }, read: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
