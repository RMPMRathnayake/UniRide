import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  studentName: { type: String, default: "" },
  driverName: { type: String, default: "" },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, default: "" },
  status: { type: String, enum: ["open", "reviewing", "resolved"], default: "open" }
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
