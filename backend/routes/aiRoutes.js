const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { summarizeDocument, summarizeQuickFile } = require('../controllers/aiController');

// 1. Configure short-lived disk storage for on-the-fly analysis uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `quick-ai-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 2. Limit input types to PDF and standard images (JPEG, JPG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|jpeg|jpg|png/;
  const extCheck = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeCheck = allowedExtensions.test(file.mimetype);

  if (extCheck && mimeCheck) {
    cb(null, true);
  } else {
    cb(new Error('Security Validation Error: Only standard PDF, JPEG, JPG, and PNG documents are supported for AI processing.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max for summarization uploads
});

// 3. Define AI Routes (Protected by Auth middleware)
router.post('/summarize/:id', protect, summarizeDocument);
router.post(
  '/summarize-file', 
  protect, 
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  summarizeQuickFile
);

module.exports = router;
