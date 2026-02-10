import { createRequire } from "module";
import { summarizeWithOpenRouter } from "../services/openrouter.service.js";

const require = createRequire(import.meta.url);
const parsePdf = require("../utils/pdfParse.cjs");

export const summarizePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const pdfText = await parsePdf(req.file.buffer);

    if (!pdfText || pdfText.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "No readable text found in PDF" });
    }

    const text = pdfText.slice(0, 12000);

    const summary = await summarizeWithOpenRouter(text);

    res.json({
      summary: summary,
    });
  } catch (err) {
    console.error("PDF summary error:", err);
    res.status(500).json({ message: err.message || "PDF summary failed" });
  }
};
