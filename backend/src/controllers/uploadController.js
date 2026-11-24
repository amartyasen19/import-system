
const fs = require("fs");
const db = require("../config/database");

const csvService = require("../services/csvService");
const validationService = require("../services/validationService");

const batchModel = require("../models/batchModel");
const transactionModel = require("../models/transactionModel");
const auditLogModel = require("../models/auditLogModel");

const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file"
      });
    }

    const filePath = req.file.path;

    try {
      const { headers, rows } = await csvService.parseCSV(filePath);

      if (headers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "CSV file is empty"
        });
      }

      const requiredHeaders = [
        "transaction_id",
        "customer_name",
        "account_number",
        "amount"
      ];

      const hasAllHeaders = requiredHeaders.every(
        (header) => headers.includes(header)
      );

      if (!hasAllHeaders) {
        return res.status(400).json({
          success: false,
          message: "Invalid CSV headers. Required: " +
            requiredHeaders.join(", ")
        });
      }

      if (new Set(headers).size !== headers.length) {
        return res.status(400).json({
          success: false,
          message: "CSV contains duplicate column headers"
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "CSV has headers but no data records"
        });
      }

      const { validRecords, invalidRecords } =
        validationService.validateTransactions(rows);

      const performedBy = String(req.body.performed_by || "MAKER").trim().slice(0, 100) || "MAKER";

      // Save batch, valid transactions and audit log atomically
      const saveBatch = db.transaction(() => {
        const batchResult = batchModel.createBatch.run(
          req.file.originalname,
          rows.length,
          validRecords.length,
          invalidRecords.length
        );

        const batchId = batchResult.lastInsertRowid;

        validRecords.forEach((record) => {
          transactionModel.createTransaction.run(
            batchId,
            record.transaction_id,
            record.customer_name,
            record.account_number,
            record.amount
          );
        });

        auditLogModel.createAuditLog.run(
          batchId,
          "BATCH_UPLOADED",
          performedBy,
          `Uploaded ${rows.length} records. Valid: ${validRecords.length}, Invalid: ${invalidRecords.length}`
        );

        return batchId;
      });

      const batchId = saveBatch();

      return res.status(201).json({
        success: true,
        message: "CSV uploaded and processed successfully",
        data: {
          batchId,
          fileName: req.file.originalname,
          totalRecords: rows.length,
          validRecords: validRecords.length,
          invalidRecords: invalidRecords.length,
          transactions: validRecords.map((record) => ({
            ...record,
            status: "PENDING"
          })),
          errors: invalidRecords
        }
      });
    } finally {
      // Remove uploaded file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadCSV };
