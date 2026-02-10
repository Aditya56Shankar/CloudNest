import express from "express";
import multer from "multer";
import { summarizePDF } from "../controllers/pdfController.js";

const router = express.Router();
const upload = multer(); // memory storage

router.post("/summary", upload.single("pdf"), summarizePDF);

export default router;
