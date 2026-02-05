import express from "express";
import axios from "axios";
import parsePdf from "../utils/pdfParse.cjs";
import { summarizeWithOpenRouter } from "../services/openrouter.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

/**
 * POST /api/pdf/summarize-by-url
 * Body: { pdfUrl: string }
 */
router.post("/summarize-by-url", async (req, res, next) => {
  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl || typeof pdfUrl !== "string") {
      throw new ApiError(400, "Valid PDF URL is required");
    }

    // ✅ Backend download (NO CORS issues)
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
      timeout: 15000, // ⏱ prevent hanging
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // ✅ Ensure it's actually a PDF
    const contentType = pdfResponse.headers["content-type"];
    if (!contentType || !contentType.includes("pdf")) {
      throw new ApiError(400, "URL does not point to a valid PDF");
    }

    const pdfBuffer = Buffer.from(pdfResponse.data);

    // Extract text
    const extractedText = await parsePdf(pdfBuffer);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new ApiError(400, "Unable to extract readable text from PDF");
    }

    // 🔒 Token safety for DeepSeek R1 (free tier)
    const safeText = extractedText.substring(0, 12000);

    // 🧠 OpenRouter DeepSeek R1 summarization
    const summary = await summarizeWithOpenRouter(safeText);

    return res.status(200).json(
      new ApiResponse(200, { summary }, "PDF summarized successfully")
    );
  } catch (error) {
    // Always forward to error middleware
    next(error);
  }
});

export default router;
