import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  driverName: { type: String, default: "" },
  plateNumber: { type: String, required: true, unique: true, trim: true },
  type: { type: String, default: "Three-wheeler" },
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Vehicle", vehicleSchema);
