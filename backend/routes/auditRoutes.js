const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

// Audit logs are highly confidential - restricted to System Admins
router.get('/', protect, restrictTo('Admin'), getAuditLogs);

module.exports = router;
