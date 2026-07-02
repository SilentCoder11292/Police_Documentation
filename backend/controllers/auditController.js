const AuditLog = require('../models/auditLogModel');

/**
 * @desc    Fetch all system audit logs
 * @route   GET /api/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'username role')
      .populate('documentId', 'caseNumber firNumber recordType')
      .sort({ timestamp: -1 });

    res.status(200).json({ 
      success: true, 
      logs 
    });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error while retrieving security audit logs.' });
  }
};

module.exports = {
  getAuditLogs
};
