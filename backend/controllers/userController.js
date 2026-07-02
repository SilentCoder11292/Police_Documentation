const User = require('../models/userModel');
const AuditLog = require('../models/auditLogModel');

/**
 * @desc    Fetch list of all system users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Internal server error while fetching user database.' });
  }
};

/**
 * @desc    Create a new system user
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { username, password, role, phoneNumber } = req.body;

    if (!username || !password || !role || !phoneNumber) {
      return res.status(400).json({ message: 'Validation Error: Username, password, role, and phone number are required.' });
    }

    // Check if username exists
    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Validation Error: Username already exists in system node.' });
    }

    const newUser = new User({
      username: username.toLowerCase(),
      password, // Hashed on pre-save hook
      role,
      accountStatus: 'Active',
      phoneNumber
    });

    const savedUser = await newUser.save();

    // Log user creation in AuditLog
    await AuditLog.create({
      action: `System User Created: "${savedUser.username}" with role [${savedUser.role}]`,
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'New officer account registered successfully.',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role,
        accountStatus: savedUser.accountStatus
      }
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Internal server error while registering new user.' });
  }
};

/**
 * @desc    Toggle accountStatus of a system user
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    // Admin cannot disable themselves to prevent lockout
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Action Prevented: Admin accounts cannot disable their own terminal credentials.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Toggle status
    const newStatus = targetUser.accountStatus === 'Active' ? 'Disabled' : 'Active';
    targetUser.accountStatus = newStatus;
    const updatedUser = await targetUser.save();

    // Log status toggle action in AuditLog
    await AuditLog.create({
      action: `Account Status Modified: User [${targetUser.username}] set to status: [${newStatus}]`,
      user: req.user._id
    });

    console.log(`[AUDIT] User Status Updated. Target: ${targetUser.username} set to: ${newStatus} by Admin: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: `User account has been successfully set to ${newStatus.toLowerCase()}.`,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        accountStatus: updatedUser.accountStatus
      }
    });

  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ message: 'Internal server error during user status modification.' });
  }
};

module.exports = {
  getUsers,
  createUser,
  toggleUserStatus
};
