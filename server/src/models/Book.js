import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number, default: 0 }, 
    cloudinaryPublicId: { type: String }, 
    isPublic: { type: Boolean, default: false },

    currentVersion: {
      type: Number,
      default: 1
    },
    hasVersionHistory: {
      type: Boolean,
      default: false
    },

    isStarred: {
      type: Boolean,
      default: false
    },

    lastAccessedAt: {
      type: Date,
      default: Date.now
    },

    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
