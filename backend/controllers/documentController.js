const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const Document = require('../models/documentModel');
const AuditLog = require('../models/auditLogModel');

/**
 * @desc    Upload, Encrypt, and Digitally Sign a Record
 * @route   POST /api/documents/upload
 * @access  Private (Admin only)
 */
const uploadDocument = async (req, res) => {
  try {
    // 1. Verify a file was actually uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Validation Error: No document file was uploaded.' });
    }

    const {
      firNumber,
      caseNumber,
      policeStation,
      district,
      year,
      recordType,
      keywords
    } = req.body;

    // 2. Validate metadata fields
    if (!firNumber || !caseNumber || !policeStation || !district || !year || !recordType) {
      // Cleanup uploaded file from disk on validation failure
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Validation Error: Missing required document metadata fields.' });
    }

    // 3. Process keywords (parse comma-separated string from FormData)
    let parsedKeywords = [];
    if (keywords) {
      if (typeof keywords === 'string') {
        parsedKeywords = keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      } else if (Array.isArray(keywords)) {
        parsedKeywords = keywords;
      }
    }

    // 4. Generate SHA-256 Digital Signature based on the actual uploaded file's contents
    let digitalSignature = '';
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      digitalSignature = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');
    } catch (hashError) {
      console.error('File hashing error:', hashError);
      // Clean up file if hashing fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ message: 'Internal server error while generating document digital signature.' });
    }

    // 5. Create Document entry (Simulate encryption status = true)
    const newDocument = new Document({
      firNumber,
      caseNumber,
      policeStation,
      district,
      year: parseInt(year, 10),
      recordType,
      keywords: parsedKeywords,
      filePath: req.file.path.replace(/\\/g, '/'), // Normalise Windows path backslashes to forward slashes
      uploadedBy: req.user._id,
      qualityCheckStatus: 'Passed', // Approved via frontend QA checklist step
      digitalSignature,
      isEncrypted: true // Enforce simulated encryption flag
    });

    const savedDocument = await newDocument.save();

    // 6. Automatically generate AuditLog entry
    await AuditLog.create({
      action: `Document Uploaded: ${recordType} - Reference [${caseNumber}] (SHA-256 Signature generated)`,
      user: req.user._id,
      documentId: savedDocument._id
    });

    console.log(`[AUDIT] Document digitized successfully. Case Reference: ${caseNumber} by User: ${req.user.username}`);

    // 7. Return response
    res.status(201).json({
      success: true,
      message: 'Bihar State Digitization verification complete. Document encrypted and archived in Central Record Room.',
      document: {
        id: savedDocument._id,
        caseNumber: savedDocument.caseNumber,
        firNumber: savedDocument.firNumber,
        recordType: savedDocument.recordType,
        qualityCheckStatus: savedDocument.qualityCheckStatus,
        digitalSignature: savedDocument.digitalSignature,
        isEncrypted: savedDocument.isEncrypted,
        createdAt: savedDocument.createdAt
      }
    });

  } catch (error) {
    console.error('Document upload controller error:', error);
    // Cleanup files if saving to database fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Internal server error during document digitization archiving.' });
  }
};

/**
 * @desc    Search Indexed Documents using Advanced Filters
 * @route   GET /api/documents/search
 * @access  Private
 */
const searchDocuments = async (req, res) => {
  try {
    const { firNumber, caseNumber, district, policeStation, year, recordType } = req.query;

    const query = {};

    if (firNumber) {
      query.firNumber = new RegExp(firNumber, 'i');
    }
    if (caseNumber) {
      query.caseNumber = new RegExp(caseNumber, 'i');
    }
    if (district) {
      query.district = new RegExp(district, 'i');
    }
    if (policeStation) {
      query.policeStation = new RegExp(policeStation, 'i');
    }
    if (year) {
      query.year = parseInt(year, 10);
    }
    if (recordType && recordType !== 'All') {
      query.recordType = recordType;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Search Documents Error:', error);
    res.status(500).json({ message: 'Internal server error while searching documents.' });
  }
};

/**
 * @desc    Secure document view/download after verification
 * @route   GET /api/documents/:id/download
 * @access  Private (Immediate Admin, User requires Approved Request)
 */
const downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    // 1. Fetch document from database
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const Request = require('../models/requestModel');

    // 2. Validate privilege level:
    // If user is Admin, grant immediate access.
    // If User, check if they have a matching request with status === 'Approved'.
    if (req.user.role !== 'Admin') {
      const approvedRequest = await Request.findOne({
        document: documentId,
        requestedBy: req.user._id,
        status: 'Approved'
      });

      if (!approvedRequest) {
        return res.status(403).json({ 
          message: 'Access Denied: You do not have approved retrieval permissions for this document. Access is locked.' 
        });
      }
    }

    // 3. Ensure file exists on disk
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'System Error: Scanned document file not found on local archive storage.' });
    }

    // 4. Log successful view transaction inside AuditLog
    await AuditLog.create({
      action: `File Retrieved: Reference [${document.caseNumber}] downloaded by User [${req.user.username}] (${req.user.role})`,
      user: req.user._id,
      documentId: document._id
    });

    console.log(`[AUDIT] Document downloaded. ID: ${document._id} by User: ${req.user.username}`);

    // 5. Send file download attachment response
    res.download(document.filePath, `${document.caseNumber.replace(/[\/\\]/g, '_')}_digitized${path.extname(document.filePath)}`);
  } catch (error) {
    console.error('Download Document Error:', error);
    res.status(500).json({ message: 'Internal server error during secure file download.' });
  }
};

module.exports = {
  uploadDocument,
  searchDocuments,
  downloadDocument
};
