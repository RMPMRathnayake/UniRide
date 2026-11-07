import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
  deliveryCode: { type: String, required: true, unique: true },
  studentName: { type: String, default: "" },
  driverName: { type: String, default: "" },
  items: { type: String, default: "" },
  pickup: { type: String, default: "" },
  destination: { type: String, default: "" },
  amount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["pending", "accepted", "in_transit", "delivered", "cancelled"], default: "pending", index: true }
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);
