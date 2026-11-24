
const db = require("../config/database");
const batchModel = require("../models/batchModel");
const transactionModel = require("../models/transactionModel");
const auditLogModel = require("../models/auditLogModel");

const approveBatch = db.transaction((batchId, performedBy) => {
  const batch = batchModel.getBatchById.get(batchId);

  if (!batch) {
    throw new Error("Batch not found");
  }

  const counts = transactionModel.getTransactionCounts.get(batchId);

  if (!counts || counts.total === 0) {
    throw new Error("Batch has no valid transactions to approve");
  }

  if (counts.pending === 0) {
    throw new Error("Batch is already approved");
  }

  transactionModel.approveTransactions.run(batchId);

  auditLogModel.createAuditLog.run(
    batchId,
    "BATCH_APPROVED",
    performedBy,
    `Authorized ${counts.pending} transactions`
  );

  return {
    batchId,
    approvedCount: counts.pending,
    status: "AUTHORIZED"
  };
});

module.exports = { approveBatch };
