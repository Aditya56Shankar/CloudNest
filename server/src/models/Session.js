import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  expiresAt: { type: Date, required: true },
  token: { type: String, unique: true, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
