
const db = require("../config/database");

const createBatch = db.prepare(`
  INSERT INTO batches (
    file_name,
    total_records,
    valid_records,
    invalid_records
  )
  VALUES (?, ?, ?, ?)
`);

const getAllBatches = db.prepare(`
  SELECT
    b.*,
    COALESCE(SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_count,
    COALESCE(SUM(CASE WHEN t.status = 'AUTHORIZED' THEN 1 ELSE 0 END), 0) AS authorized_count
  FROM batches b
  LEFT JOIN transactions t ON b.id = t.batch_id
  GROUP BY b.id
  ORDER BY b.id DESC
`);

const getBatchById = db.prepare(`
  SELECT * FROM batches WHERE id = ?
`);

const updateBatchCounts = db.prepare(`
  UPDATE batches
  SET total_records = ?,
      valid_records = ?,
      invalid_records = ?
  WHERE id = ?
`);

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatchCounts
};
