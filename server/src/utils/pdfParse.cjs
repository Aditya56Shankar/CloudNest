const pdfParse = require("pdf-parse");

module.exports = function parsePdf(buffer) {
  return pdfParse(buffer);
};
