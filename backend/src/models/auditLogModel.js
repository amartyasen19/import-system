
const db = require("../config/database");

const createAuditLog = db.prepare(`
  INSERT INTO audit_logs (
    batch_id,
    action,
    performed_by,
    details
  )
  VALUES (?, ?, ?, ?)
`);

const getAllAuditLogs = db.prepare(`
  SELECT
    a.*,
    b.file_name
  FROM audit_logs a
  LEFT JOIN batches b ON a.batch_id = b.id
  ORDER BY a.id DESC
`);

module.exports = {
  createAuditLog,
  getAllAuditLogs
};
