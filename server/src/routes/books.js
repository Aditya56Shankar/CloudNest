import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";
import Book from "../models/Book.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const router = express.Router();


// PUBLIC BOOKS
router.get("/public", async (req, res) => {
  try {
    const books = await Book.find({
      isPublic: true,
      isDeleted: false
    })
      .populate("userId", "name email")
      .exec();

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public books" });
  }
});


// USER'S BOOKS
router.get("/my-books", authenticate, async (req, res) => {
  try {
    const books = await Book.find({
      userId: req.user._id,
      isDeleted: false
    });

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your books" });
  }
});

// STARRED BOOKS
router.get("/starred", authenticate, async (req, res) => {
  try {
    const books = await Book.find({
      userId: req.user._id,
      isDeleted: false,
      isStarred: true
    }).sort({ updatedAt: -1 });

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch starred books" });
  }
});

// RECENT BOOKS (sorted by last accessed)
router.get("/recent", authenticate, async (req, res) => {
  try {
    const books = await Book.find({
      userId: req.user._id,
      isDeleted: false
    })
      .sort({ lastAccessedAt: -1 })
      .limit(20); // Show last 20 accessed files

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent books" });
  }
});

router.get("/recycle-bin", authenticate, async (req, res) => {
  const books = await Book.find({
    userId: req.user._id,
    isDeleted: true
  }).sort({ deletedAt: -1 });

  res.json(books);
});

// TOGGLE STAR (must be before /:id route)
router.patch("/:id/star", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Toggle star request for ID:", id);
    console.log("User:", req.user?._id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid book ID");
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await Book.findById(id);
    console.log("Book found:", book ? "yes" : "no");

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    console.log("Book userId:", book.userId);
    console.log("Current isStarred:", book.isStarred);

    if (String(book.userId) !== String(req.user._id)) {
      console.log("Not authorized");
      return res.status(403).json({ error: "Not authorized" });
    }

    // Toggle starred status
    book.isStarred = !book.isStarred;
    await book.save();

    console.log("New isStarred:", book.isStarred);

    res.json({
      message: book.isStarred ? "File starred" : "File unstarred",
      book
    });
  } catch (err) {
    console.error("Toggle star error:", err);
    res.status(500).json({ error: "Failed to update star status" });
  }
});


// GET BOOK BY ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await Book.findOne({
      _id: id,
      isDeleted: false
    })
      .populate("userId", "name email")
      .exec();

    if (!book) return res.status(404).json({ error: "Book not found" });

    if (!book.isPublic && String(book.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update last accessed time
    book.lastAccessedAt = new Date();
    await book.save();

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch book" });
  }
});


// CREATE BOOK
router.post(
  "/",
  authenticate,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const { title, author, description, isPublic } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path);
      fileUrl = result.secure_url;
      fileName = req.file.originalname;
    }

    const book = await Book.create({
      title,
      author,
      description,
      isPublic,
      userId: req.user._id, // ✅ FIXED
      fileUrl,
      fileName,
    });

    res.status(201).json(book);
  })
);

// UPDATE BOOK
router.put(
  "/:id",
  authenticate,
  upload.single("file"),
  asyncHandler(async (req, res) => {

    const id = req.params.id; // always available now

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: "Book ID is required and must be valid" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (String(book.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    let fileUrl = book.fileUrl;
    let fileName = book.fileName;

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path);
      fileUrl = result.secure_url;
      fileName = req.file.originalname;
    }

    const updated = await Book.findByIdAndUpdate(
      id,
      { ...req.body, fileUrl, fileName },
      { new: true }
    );

    res.json(updated);
  })
);

//restore put
router.put("/:id/restore", authenticate, async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) return res.status(404).json({ error: "Book not found" });

  if (String(book.userId) !== String(req.user._id)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  book.isDeleted = false;
  book.deletedAt = null;
  await book.save();

  res.json({ message: "Book restored successfully" });
});

// RESTORE BOOK FROM TRASH
router.put("/:id/restore", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Authorization
    if (String(book.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Restore
    book.isDeleted = false;
    book.deletedAt = null;
    await book.save();

    res.status(200).json({
      message: "Book restored successfully",
      book
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to restore book" });
  }
});


// DELETE BOOK
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Authorization check
    if (String(book.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // ♻️ SOFT DELETE (Move to Recycle Bin)
    book.isDeleted = true;
    book.deletedAt = new Date();
    await book.save();

    res.status(200).json({ message: "Book moved to Recycle Bin" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// RESTORE BOOK delete
router.delete("/:id/permanent", authenticate, async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) return res.status(404).json({ error: "Book not found" });

  if (String(book.userId) !== String(req.user._id)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  // OPTIONAL: delete from cloudinary if needed
  // await cloudinary.uploader.destroy(book.publicId);

  await Book.findByIdAndDelete(req.params.id);

  res.json({ message: "Book permanently deleted" });
});



export default router;
