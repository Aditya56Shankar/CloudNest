const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  name: String,
  url: String,
  publicId: String,   // cloudinary id
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // 🔽 Recycle Bin fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("File", FileSchema);
