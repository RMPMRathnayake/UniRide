import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Set MONGODB_URI and JWT_SECRET in .env first.");
  process.exit(1);
}
const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
const name = String(process.env.ADMIN_NAME || "UniRide Admin");
if (!email || password.length < 12) {
  console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env.");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists. No changes made.");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role: "admin", status: "active" });
    console.log(`Admin created: ${email}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
