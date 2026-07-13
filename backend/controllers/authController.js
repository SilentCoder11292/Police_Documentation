const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const twilioService = require('../services/twilioService');
const AuditLog = require('../models/auditLogModel');


/**
 * @desc    Initial login validation: checks credentials, dispatches verification SMS via Twilio Verify API
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validate request body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // 2. Find user in the database
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 3. Check if account is Disabled
    if (user.accountStatus === 'Disabled') {
      return res.status(403).json({ message: 'Access Denied: Your account has been disabled. Please contact the administrator.' });
    }

    // 4. Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 5. Dispatch SMS OTP verification via Twilio Verify Service
    if (!twilioService.isConfigured) {
      console.warn('[OTP WARNING] Twilio Verify credentials are not configured. Returning 500 configuration error.');
      return res.status(500).json({ 
        message: 'SMS Verify Failure: Twilio Verify credentials are not configured in the server environment.' 
      });
    }

    try {
      await twilioService.sendOTP(user.phoneNumber);
    } catch (smsError) {
      console.error('Twilio Verify Dispatch Error:', smsError);
      return res.status(500).json({ 
        message: `SMS Dispatch Failure: Failed to trigger verification to registered number ${user.phoneNumber}. Details: ${smsError.message}` 
      });
    }

    // 6. Respond with the username as temporary tracking reference
    res.status(200).json({
      success: true,
      username: user.username,
      message: 'Primary authentication successful. A 2FA verification OTP has been sent to your registered mobile number.'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

/**
 * @desc    Verify Twilio Verify OTP and issue secure JWT
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { username, otp } = req.body;

    // 1. Validate request body
    if (!username || !otp) {
      return res.status(400).json({ message: 'Username and OTP code are required' });
    }

    // 2. Fetch user to get registered phone number
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.accountStatus === 'Disabled') {
      return res.status(403).json({ message: 'Access Denied: Your account has been disabled.' });
    }

    // 3. Trigger Twilio verification check
    if (!twilioService.isConfigured) {
      return res.status(500).json({ 
        message: 'SMS Verify Failure: Twilio Verify credentials are not configured in the server environment.' 
      });
    }

    try {
      const isApproved = await twilioService.verifyOTP(user.phoneNumber, otp);

      if (!isApproved) {
        return res.status(400).json({ message: 'Invalid or expired 2FA verification code.' });
      }
    } catch (verifyError) {
      console.error('Twilio Verification Check Error:', verifyError);
      return res.status(500).json({ 
        message: `Verification Check Failure: Twilio verification check error. Details: ${verifyError.message}` 
      });
    }

    // 4. Verification succeeded - issue final JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secure_jwt_secret_key_98765',
      { expiresIn: '24h' }
    );

    // 5. Log successful login transaction in AuditLog
    await AuditLog.create({
      action: 'User Session Authenticated (2FA Verified via Twilio)',
      user: user._id
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error during OTP verification' });
  }
};

module.exports = {
  login,
  verifyOtp
};
