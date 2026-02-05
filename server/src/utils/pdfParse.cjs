const pdfParse = require("pdf-parse");

module.exports = async function parsePdf(buffer) {
  // Suppress console warnings from pdf-parse
  const originalWarn = console.warn;
  console.warn = () => { };

  try {
    const data = await pdfParse(buffer);
    return data.text; // Return only the text content
  } finally {
    console.warn = originalWarn;
  }
};
