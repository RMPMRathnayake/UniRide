import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phoneNumber: {
      type: String,
      required: function () {
        return this.isNew;
      },
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"]
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["student", "rider"],
      required: true
    },

    // Student details
    studentRegistrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    // Rider details
    vehicleNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    // Security Question Password Recovery
    securityQuestion: {
      type: String,
      default: null
    },

    securityAnswerHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;