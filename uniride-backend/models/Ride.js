import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  rideCode: { type: String, required: true, unique: true },
  studentName: { type: String, default: "" },
  driverName: { type: String, default: "" },
  pickup: { type: String, default: "" },
  destination: { type: String, default: "" },
  fare: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["pending", "accepted", "in_transit", "completed", "cancelled"], default: "pending", index: true }
}, { timestamps: true });

export default mongoose.model("Ride", rideSchema);
