import { createRequire } from "module";
import { summarizeWithOpenRouter } from "../services/openrouter.service.js";

const require = createRequire(import.meta.url);
const parsePdf = require("../utils/pdfParse.cjs");

const INVALID_NAME_TOKENS = new Set([
  "linkedin",
  "github",
  "summary",
  "education",
  "experience",
  "internship",
  "skills",
  "objective",
  "profile",
  "contact",
  "candidate",
]);

const sanitizeNameToken = (token = "") =>
  token
    .replace(/[^A-Za-z]/g, "")
    .trim()
    .toLowerCase();

const isValidNameToken = (token = "") => {
  const normalized = sanitizeNameToken(token);
  return normalized && !INVALID_NAME_TOKENS.has(normalized);
};

const toParagraphSummary = (content = "") => {
  const cleaned = (content || "")
    .replace(/^\s*domain\s*:.*$/gim, "")
    .replace(/^\s*professional summary\s*[:\-]?\s*$/gim, "")
    .trim();

  if (!cleaned) {
    return "Summary not available.";
  }

  return cleaned
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
};

const capitalizeFirstLetter = (value = "") => {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return "Candidate";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const extractCandidateName = (text = "") => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();

  const namePatterns = [
    /name\s*[:\-]?\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
    /name([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
  ];

  for (const pattern of namePatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const firstName = match[1].trim().split(/\s+/)[0];
      if (isValidNameToken(firstName)) {
        return sanitizeNameToken(firstName);
      }
    }
  }

  // Common resume pattern: name appears at the very beginning (e.g., SONU SINGH BISHT ...)
  const leadingNameMatch = normalized.match(/^([A-Za-z]{2,}(?:\s+[A-Za-z]{2,}){1,2})\b/);
  if (leadingNameMatch?.[1]) {
    const firstName = leadingNameMatch[1].trim().split(/\s+/)[0];
    if (isValidNameToken(firstName)) {
      return sanitizeNameToken(firstName);
    }
  }

  // Fallback for resume-like text where first line is full name
  const lines = (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  for (const line of lines) {
    const cleaned = line.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();
    const words = cleaned.split(" ").filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      if (isValidNameToken(words[0])) {
        return sanitizeNameToken(words[0]);
      }
    }
  }

  return "candidate";
};

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

    const summaryResult = await summarizeWithOpenRouter(text);
    const candidateName = extractCandidateName(text);
    const candidateNameDisplay = capitalizeFirstLetter(candidateName);
    const predictedRole = summaryResult.predictedRole && summaryResult.predictedRole !== "Unknown"
      ? summaryResult.predictedRole
      : "General Software/IT";
    const roleLine = `${candidateNameDisplay} is a ${predictedRole}`;
    const paragraphBody = toParagraphSummary(summaryResult.content || "");
    const formattedSummary = `${roleLine}\n\n${paragraphBody}`;

    res.json({
      summary: formattedSummary,
      type: summaryResult.type,
      model: summaryResult.model,
      fallbackReason: summaryResult.fallbackReason,
      predictedRole,
      extractedSkills: summaryResult.extractedSkills || [],
    });
  } catch (err) {
    console.error("PDF summary error:", err);
    res.status(500).json({ message: err.message || "PDF summary failed" });
  }
};
