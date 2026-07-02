const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Protect routes by verifying JWT token from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists in authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No authentication token provided.' });
  }

  try {
    // 2. Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_ बिहार_पुलिस_drrp');

    // 3. Find user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Access Denied: The user account associated with this token does not exist.' });
    }

    // 4. Ensure account status is Active
    if (user.accountStatus === 'Disabled') {
      return res.status(403).json({ message: 'Access Denied: Your account has been disabled. Access terminated.' });
    }

    // 5. Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(401).json({ message: 'Access Denied: Authentication token is invalid or has expired.' });
  }
};

/**
 * Restrict access to designated user roles (RBAC)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ message: 'Internal server order error: "protect" middleware must run before "restrictTo".' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Restricted access. Action requires privileges: [${roles.join(', ')}]. Your role: [${req.user.role}].` 
      });
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
