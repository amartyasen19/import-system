
const db = require("../config/database");

const createTransaction = db.prepare(`
  INSERT INTO transactions (
    batch_id,
    transaction_id,
    customer_name,
    account_number,
    amount,
    status
  )
  VALUES (?, ?, ?, ?, ?, 'PENDING')
`);

const getTransactionsByBatchId = db.prepare(`
  SELECT * FROM transactions
  WHERE batch_id = ?
  ORDER BY id ASC
`);

const findByTransactionId = db.prepare(`
  SELECT * FROM transactions
  WHERE transaction_id = ?
`);

const approveTransactions = db.prepare(`
  UPDATE transactions
  SET status = 'AUTHORIZED'
  WHERE batch_id = ? AND status = 'PENDING'
`);

const getTransactionCounts = db.prepare(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'AUTHORIZED' THEN 1 ELSE 0 END) AS authorized
  FROM transactions
  WHERE batch_id = ?
`);

module.exports = {
  createTransaction,
  getTransactionsByBatchId,
  findByTransactionId,
  approveTransactions,
  getTransactionCounts
};
