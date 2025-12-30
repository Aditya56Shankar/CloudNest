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
    isPublic: { type: Boolean, default: false },

    // ⭐ Starred field
    isStarred: {
      type: Boolean,
      default: false
    },

    // 📅 Last accessed field for recent files
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },

    // ♻️ Recycle Bin fields
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
