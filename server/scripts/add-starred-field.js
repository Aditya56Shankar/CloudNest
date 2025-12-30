import mongoose from "mongoose";
import Book from "../src/models/Book.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cloudtemp";

async function addStarredField() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Update all books that don't have isStarred field
        const result = await Book.updateMany(
            { isStarred: { $exists: false } },
            { $set: { isStarred: false, lastAccessedAt: new Date() } }
        );

        console.log(`Updated ${result.modifiedCount} books with isStarred field`);

        // Also update books that have isStarred but no lastAccessedAt
        const result2 = await Book.updateMany(
            { lastAccessedAt: { $exists: false } },
            { $set: { lastAccessedAt: new Date() } }
        );

        console.log(`Updated ${result2.modifiedCount} books with lastAccessedAt field`);

        await mongoose.disconnect();
        console.log("Done!");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

addStarredField();
