const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSystemStats } = require('../controllers/statsController');

// System statistics can be accessed by all logged-in portal users
router.get('/stats', protect, getSystemStats);

module.exports = router;
