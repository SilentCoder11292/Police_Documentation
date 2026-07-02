const express = require('express');
const router = express.Router();
const { login, verifyOtp } = require('../controllers/authController');

// Authentication routes
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

module.exports = router;
