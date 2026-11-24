
const batchModel = require("../models/batchModel");
const transactionModel = require("../models/transactionModel");
const approvalService = require("../services/approvalService");

// GET /batches
const getBatches = (req, res, next) => {
  try {
    const batches = batchModel.getAllBatches.all();

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

// GET /batches/:id
const getBatchDetails = (req, res, next) => {
  try {
    const batchId = Number(req.params.id);

    if (!Number.isInteger(batchId) || batchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID"
      });
    }

    const batch = batchModel.getBatchById.get(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const transactions =
      transactionModel.getTransactionsByBatchId.all(batchId);

    res.status(200).json({
      success: true,
      data: {
        batch,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /batches/:id/approve
const approveBatch = (req, res, next) => {
  try {
    const batchId = Number(req.params.id);

    if (!Number.isInteger(batchId) || batchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID"
      });
    }

    const performedBy = String(req.body.performed_by || "CHECKER").trim().slice(0, 100) || "CHECKER";

    const result = approvalService.approveBatch(
      batchId,
      performedBy
    );

    res.status(200).json({
      success: true,
      message: "Batch approved successfully",
      data: result
    });
  } catch (error) {
    if (
      error.message === "Batch not found" ||
      error.message === "Batch has no valid transactions to approve"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === "Batch is already approved") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

module.exports = {
  getBatches,
  getBatchDetails,
  approveBatch
};
