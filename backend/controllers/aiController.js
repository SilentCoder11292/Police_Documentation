const fs = require('fs');
const Document = require('../models/documentModel');
const Request = require('../models/requestModel');
const AuditLog = require('../models/auditLogModel');
const geminiService = require('../services/geminiService');

/**
 * @desc    Generate and cache a summary for a record in the central room
 * @route   POST /api/ai/summarize/:id
 * @access  Private (Admins have direct access, Users require Approved Request)
 */
const summarizeDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { customPrompt } = req.body;

    // 1. Fetch document from the database
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Central room document record not found.' });
    }

    // 2. Security validation: Check user privilege level
    if (req.user.role !== 'Admin') {
      const approvedRequest = await Request.findOne({
        document: documentId,
        requestedBy: req.user._id,
        status: 'Approved'
      });

      if (!approvedRequest) {
        return res.status(403).json({ 
          message: 'Access Denied: You do not have approved retrieval access for this document. AI analysis is locked.' 
        });
      }
    }

    // 3. Return cached summary if it exists and no custom prompt override is requested
    if (document.summary && !customPrompt) {
      console.log(`[AI CACHE] Serving cached summary for case: ${document.caseNumber}`);
      return res.status(200).json({
        success: true,
        summary: document.summary,
        cached: true,
        summaryGeneratedAt: document.summaryGeneratedAt
      });
    }

    // 4. Run Gemini API generation
    console.log(`[AI SERVICE] Generating fresh summary for case: ${document.caseNumber}`);
    const summary = await geminiService.generateDocumentSummary(document.filePath, customPrompt);

    // 5. Cache summary inside the document schema
    document.summary = summary;
    document.summaryGeneratedAt = new Date();
    await document.save();

    // 6. Generate audit log for tracking
    await AuditLog.create({
      action: `AI Document Summary Generated: Case Reference [${document.caseNumber}] (Model: Gemini 1.5 Flash)`,
      user: req.user._id,
      documentId: document._id
    });

    res.status(200).json({
      success: true,
      summary,
      cached: false,
      summaryGeneratedAt: document.summaryGeneratedAt
    });

  } catch (error) {
    console.error('Document summarizer controller error:', error);
    res.status(500).json({ message: error.message || 'Internal server error while generating AI summary.' });
  }
};

/**
 * @desc    Summarize any PDF/Image on-the-fly without saving to central registry
 * @route   POST /api/ai/summarize-file
 * @access  Private (Authenticated users only)
 */
const summarizeQuickFile = async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Validation Error: No file was uploaded for summarization.' });
    }

    tempFilePath = req.file.path;
    const { customPrompt } = req.body;

    console.log(`[AI QUICK SERVICE] Analyzing temporary file on-the-fly: ${req.file.originalname}`);

    // Call Gemini API to extract summary from temp file
    const summary = await geminiService.generateDocumentSummary(tempFilePath, customPrompt);

    // Clean up temporary file from uploads directory immediately
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Quick file summarizer controller error:', error);
    // Cleanup temporary file in case of exception
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkErr) {
        console.error('Error cleaning up temp file:', unlinkErr);
      }
    }
    res.status(500).json({ message: error.message || 'Internal server error during on-the-fly AI analysis.' });
  }
};

module.exports = {
  summarizeDocument,
  summarizeQuickFile
};
