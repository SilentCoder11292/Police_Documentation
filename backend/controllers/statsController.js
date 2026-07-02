const Document = require('../models/documentModel');
const Request = require('../models/requestModel');
const User = require('../models/userModel');

/**
 * @desc    Get Real-Time System statistics
 * @route   GET /api/system/stats
 * @access  Private (Registered authenticated users)
 */
const getSystemStats = async (req, res) => {
  try {
    const documentCount = await Document.countDocuments({});
    const requestCount = await Request.countDocuments({});
    const pendingRequestCount = await Request.countDocuments({ status: 'Pending' });
    const userCount = await User.countDocuments({});

    res.status(200).json({
      success: true,
      stats: {
        documents: documentCount,
        requests: requestCount,
        pendingRequests: pendingRequestCount,
        users: userCount
      }
    });
  } catch (error) {
    console.error('Get System Stats Error:', error);
    res.status(500).json({ message: 'Internal server error while retrieving database metrics.' });
  }
};

module.exports = {
  getSystemStats
};
