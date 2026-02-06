import { OpenAI } from "openai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const parsePdf = require("../utils/pdfParse.cjs");

export const summarizePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const pdfData = await parsePdf(req.file.buffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "No readable text found in PDF" });
    }

    const text = pdfData.text.slice(0, 12000);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize the document clearly." },
        { role: "user", content: text },
      ],
    });

    res.json({
      summary: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("PDF summary error:", err);
    res.status(500).json({ message: "PDF summary failed" });
  }
};
