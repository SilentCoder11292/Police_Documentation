const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { 
  getUsers, 
  createUser, 
  toggleUserStatus 
} = require('../controllers/userController');

// All user management routes require admin rights
router.get('/', protect, restrictTo('Admin'), getUsers);
router.post('/', protect, restrictTo('Admin'), createUser);
router.patch('/:id/status', protect, restrictTo('Admin'), toggleUserStatus);

module.exports = router;
