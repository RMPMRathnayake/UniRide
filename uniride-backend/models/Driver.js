import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: "" },
  phone: { type: String, default: "" },
  licenseNumber: { type: String, default: "" },
  vehiclePlate: { type: String, default: "" },
  documentStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  availability: { type: String, enum: ["online", "offline"], default: "offline" },
  rejectionReason: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
