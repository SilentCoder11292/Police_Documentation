const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { 
  createRequest, 
  getRequests, 
  updateRequestStatus 
} = require('../controllers/requestController');

// All request routes require authentication protection
router.post('/', protect, createRequest);
router.get('/', protect, getRequests);

// Admin-only route to approve/reject requests
router.patch('/:id/status', protect, restrictTo('Admin'), updateRequestStatus);

module.exports = router;
