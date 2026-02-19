import mongoose from "mongoose";

const fileVersionSchema = new mongoose.Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
            index: true
        },

        versionNumber: {
            type: Number,
            required: true
        },

        fileUrl: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            default: 0
        },
        cloudinaryPublicId: {
            type: String
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        comment: {
            type: String, 
            default: ""
        },

        isCurrent: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);


fileVersionSchema.index({ bookId: 1, versionNumber: -1 });

export default mongoose.model("FileVersion", fileVersionSchema);
