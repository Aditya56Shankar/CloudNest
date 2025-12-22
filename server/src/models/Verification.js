import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  value: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model("Verification", verificationSchema);
