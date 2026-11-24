
const fs = require("fs");
const csv = require("csv-parser");

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    fs.createReadStream(filePath)
      .pipe(csv({
        strict: true,
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim().toLowerCase()
      }))
      .on("headers", (parsedHeaders) => {
        headers = parsedHeaders;
      })
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        finish(null, { headers, rows });
      })
      .on("error", (error) => {
        error.statusCode = 400;
        finish(error);
      });
  });
};

module.exports = { parseCSV };
