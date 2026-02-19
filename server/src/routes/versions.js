import express from "express";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";
import Book from "../models/Book.js";
import FileVersion from "../models/FileVersion.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// GET VERSION HISTORY for a specific file/book
router.get("/:bookId/history", authenticate, asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    // Verify the book exists and belongs to the user
    const book = await Book.findOne({
        _id: bookId,
        userId: req.user._id
    });

    if (!book) {
        return res.status(404).json({ error: "File not found" });
    }

    // Get all versions sorted by version number (newest first)
    const versions = await FileVersion.find({ bookId })
        .populate("uploadedBy", "name email")
        .sort({ versionNumber: -1 });

    res.json({
        currentVersion: book.currentVersion,
        totalVersions: versions.length,
        versions
    });
}));

// UPLOAD NEW VERSION of an existing file
router.post("/:bookId/new-version", authenticate, upload.single("file"), asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { comment } = req.body;

    // Verify the book exists and belongs to the user
    const book = await Book.findOne({
        _id: bookId,
        userId: req.user._id,
        isDeleted: false
    });

    if (!book) {
        return res.status(404).json({ error: "File not found" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Save current version to FileVersion collection before updating
    if (book.fileUrl) {
        await FileVersion.create({
            bookId: book._id,
            versionNumber: book.currentVersion,
            fileUrl: book.fileUrl,
            fileName: book.fileName,
            fileSize: book.fileSize,
            cloudinaryPublicId: book.cloudinaryPublicId,
            uploadedBy: req.user._id,
            comment: "Previous version",
            isCurrent: false
        });
    }

    // Upload new file to Cloudinary
    const localPath = req.file.path;
    const cloudinaryResult = await uploadOnCloudinary(localPath);

    if (!cloudinaryResult) {
        // Clean up local file
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
        return res.status(500).json({ error: "Failed to upload file" });
    }

    // Clean up local file
    if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
    }

    // Update book with new version
    const newVersionNumber = book.currentVersion + 1;

    book.fileUrl = cloudinaryResult.secure_url;
    book.fileName = req.file.originalname;
    book.fileSize = req.file.size;
    book.cloudinaryPublicId = cloudinaryResult.public_id;
    book.currentVersion = newVersionNumber;
    book.hasVersionHistory = true;

    await book.save();

    // Create version entry for the new version
    await FileVersion.create({
        bookId: book._id,
        versionNumber: newVersionNumber,
        fileUrl: cloudinaryResult.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        cloudinaryPublicId: cloudinaryResult.public_id,
        uploadedBy: req.user._id,
        comment: comment || "New version",
        isCurrent: true
    });

    res.json({
        message: "New version uploaded successfully",
        book,
        version: newVersionNumber
    });
}));

// RESTORE a specific version
router.post("/:bookId/restore/:versionNumber", authenticate, asyncHandler(async (req, res) => {
    const { bookId, versionNumber } = req.params;

    // Verify the book exists and belongs to the user
    const book = await Book.findOne({
        _id: bookId,
        userId: req.user._id,
        isDeleted: false
    });

    if (!book) {
        return res.status(404).json({ error: "File not found" });
    }

    // Find the version to restore
    const versionToRestore = await FileVersion.findOne({
        bookId,
        versionNumber: parseInt(versionNumber)
    });

    if (!versionToRestore) {
        return res.status(404).json({ error: "Version not found" });
    }

    // Save current state as a new version before restoring
    await FileVersion.create({
        bookId: book._id,
        versionNumber: book.currentVersion,
        fileUrl: book.fileUrl,
        fileName: book.fileName,
        fileSize: book.fileSize,
        cloudinaryPublicId: book.cloudinaryPublicId,
        uploadedBy: req.user._id,
        comment: "Backup before restore",
        isCurrent: false
    });

    // Update current version flags
    await FileVersion.updateMany(
        { bookId },
        { isCurrent: false }
    );

    // Restore the selected version
    book.fileUrl = versionToRestore.fileUrl;
    book.fileName = versionToRestore.fileName;
    book.fileSize = versionToRestore.fileSize;
    book.cloudinaryPublicId = versionToRestore.cloudinaryPublicId;
    book.currentVersion = book.currentVersion + 1;

    await book.save();

    // Mark the restored version as current
    versionToRestore.isCurrent = true;
    await versionToRestore.save();

    res.json({
        message: `Restored to version ${versionNumber}`,
        book
    });
}));

// DELETE a specific version
router.delete("/:bookId/versions/:versionNumber", authenticate, asyncHandler(async (req, res) => {
    const { bookId, versionNumber } = req.params;

    // Verify the book exists and belongs to the user
    const book = await Book.findOne({
        _id: bookId,
        userId: req.user._id
    });

    if (!book) {
        return res.status(404).json({ error: "File not found" });
    }

    const version = await FileVersion.findOne({
        bookId,
        versionNumber: parseInt(versionNumber)
    });

    if (!version) {
        return res.status(404).json({ error: "Version not found" });
    }

    // Prevent deletion of current version
    if (version.versionNumber === book.currentVersion) {
        return res.status(400).json({ error: "Cannot delete the current version" });
    }

    // Delete from Cloudinary if publicId exists
    if (version.cloudinaryPublicId) {
        try {
            await deleteFromCloudinary(version.cloudinaryPublicId);
        } catch (error) {
            console.error("Failed to delete from Cloudinary:", error);
        }
    }

    // Delete the version
    await FileVersion.deleteOne({ _id: version._id });

    res.json({ message: "Version deleted successfully" });
}));

// GET details of a specific version
router.get("/:bookId/versions/:versionNumber", authenticate, asyncHandler(async (req, res) => {
    const { bookId, versionNumber } = req.params;

    // Verify the book exists and belongs to the user
    const book = await Book.findOne({
        _id: bookId,
        userId: req.user._id
    });

    if (!book) {
        return res.status(404).json({ error: "File not found" });
    }

    const version = await FileVersion.findOne({
        bookId,
        versionNumber: parseInt(versionNumber)
    }).populate("uploadedBy", "name email");

    if (!version) {
        return res.status(404).json({ error: "Version not found" });
    }

    res.json(version);
}));

export default router;
