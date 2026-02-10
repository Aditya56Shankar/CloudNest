const pdfParse = require("pdf-parse");

module.exports = async function parsePdf(buffer) {
  // Suppress console warnings and logs from pdf-parse
  const originalWarn = console.warn;
  const originalLog = console.log;
  console.warn = () => { };
  console.log = () => { };

  try {
    const data = await pdfParse(buffer);
    return data.text; // Return only the text content
  } finally {
    console.warn = originalWarn;
    console.log = originalLog;
  }
};
