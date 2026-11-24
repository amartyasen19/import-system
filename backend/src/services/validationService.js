
const transactionModel = require("../models/transactionModel");

const validateTransactions = (rows) => {
  const validRecords = [];
  const invalidRecords = [];

  const seenTransactionIds = new Set();

  const requiredFields = [
    "transaction_id",
    "customer_name",
    "account_number",
    "amount"
  ];

  rows.forEach((row, index) => {
    const errors = [];
    const rowNumber = index + 2;

    // Check mandatory fields
    requiredFields.forEach((field) => {
      if (
        row[field] === undefined ||
        row[field] === null ||
        String(row[field]).trim() === ""
      ) {
        errors.push(`${field} is required`);
      }
    });

    const transactionId = String(
      row.transaction_id || ""
    ).trim();

    const amountValue = String(row.amount || "").trim();
    const amount = Number(amountValue);

    // Validate transaction ID
    if (transactionId) {
      if (seenTransactionIds.has(transactionId)) {
        errors.push("Duplicate transaction_id within CSV");
      } else {
        seenTransactionIds.add(transactionId);
      }

      const existingTransaction =
        transactionModel.findByTransactionId.get(transactionId);

      if (existingTransaction) {
        errors.push("transaction_id already exists in database");
      }
    }

    // Validate amount
    if (amountValue !== "") {
      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push("Amount must be a valid number greater than zero");
      }
    }

    if (errors.length > 0) {
      invalidRecords.push({
        row: rowNumber,
        transaction_id: transactionId || null,
        errors
      });
    } else {
      validRecords.push({
        transaction_id: transactionId,
        customer_name: String(row.customer_name).trim(),
        account_number: String(row.account_number).trim(),
        amount
      });
    }
  });

  return {
    validRecords,
    invalidRecords
  };
};

module.exports = { validateTransactions };
