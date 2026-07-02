const Request = require('../models/requestModel');
const Document = require('../models/documentModel');
const AuditLog = require('../models/auditLogModel');

/**
 * @desc    Create Access Retrieval Request
 * @route   POST /api/requests
 * @access  Private (User only, since admins have direct download)
 */
const createRequest = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: 'Validation Error: Document ID is required.' });
    }

    // 1. Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // 2. Check if a request already exists for this user and document
    // We check if there's any request that is Pending or Approved
    const existingRequest = await Request.findOne({
      document: documentId,
      requestedBy: req.user._id,
      status: { $in: ['Pending', 'Approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: `Request validation failed: You already have a status of "${existingRequest.status}" for this document.` 
      });
    }

    // 3. Create a new request
    const request = new Request({
      document: documentId,
      requestedBy: req.user._id,
      status: 'Pending'
    });

    const savedRequest = await request.save();

    // 4. Log request in AuditLog
    await AuditLog.create({
      action: `Retrieval Requested: Document reference [${document.caseNumber}] for User [${req.user.username}]`,
      user: req.user._id,
      documentId: document._id
    });

    res.status(201).json({
      success: true,
      message: 'Access retrieval request submitted successfully.',
      request: savedRequest
    });

  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({ message: 'Internal server error while creating access request.' });
  }
};

/**
 * @desc    Get Access Retrieval Requests
 * @route   GET /api/requests
 * @access  Private (Admin gets all, User gets only their own)
 */
const getRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'Admin') {
      query.requestedBy = req.user._id;
    }

    const requests = await Request.find(query)
      .populate('document')
      .populate('requestedBy', 'username role')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({ message: 'Internal server error while fetching access requests.' });
  }
};

/**
 * @desc    Update Request Status (Approve/Reject)
 * @route   PATCH /api/requests/:id/status
 * @access  Private (Admin only)
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Validation Error: Status must be Approved or Rejected.' });
    }

    // 1. Fetch request from database
    const request = await Request.findById(requestId).populate('document');
    if (!request) {
      return res.status(404).json({ message: 'Retrieval request not found.' });
    }

    // 2. Perform update
    request.status = status;
    request.reviewedBy = req.user._id;
    const updatedRequest = await request.save();

    // 3. Log status modification inside AuditLog
    await AuditLog.create({
      action: `Retrieval request ${status}: Document [${request.document?.caseNumber || 'N/A'}] review submitted for User ID [${request.requestedBy}]`,
      user: req.user._id,
      documentId: request.document?._id
    });

    console.log(`[AUDIT] Access Request ${status}. Request ID: ${request._id} by Admin: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: `Retrieval request has been successfully ${status.toLowerCase()}.`,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Update Request Status Error:', error);
    res.status(500).json({ message: 'Internal server error while reviewing access request.' });
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequestStatus
};
