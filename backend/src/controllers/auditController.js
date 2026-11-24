
const auditLogModel = require("../models/auditLogModel");

const getAuditLogs = (req, res, next) => {
  try {
    const logs = auditLogModel.getAllAuditLogs.all();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
