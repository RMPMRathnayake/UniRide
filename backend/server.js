import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

// Main route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to UniRide Backend API",
    status: "Server Running Successfully"
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`UniRide Server running on port ${PORT}`);
  });
};

startServer();