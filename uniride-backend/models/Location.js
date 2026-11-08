import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    addressValue: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    isGps: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

export default Location;
