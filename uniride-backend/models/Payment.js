import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  transactionCode: { type: String, required: true, unique: true },
  customerName: { type: String, default: "" },
  serviceType: { type: String, enum: ["ride", "delivery"], default: "ride" },
  amount: { type: Number, default: 0, min: 0 },
  method: { type: String, default: "Cash" },
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
