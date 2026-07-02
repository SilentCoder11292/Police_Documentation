const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadDocument, searchDocuments, downloadDocument } = require('../controllers/documentController');

// 1. Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Relative to the backend project root directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generates a secure, collision-free filename preserving the extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 2. Define Allowed File Filters (PDF & standard security images only)
const fileFilter = (req, file, cb) => {
  const allowedFileExtensions = /pdf|jpeg|jpg|png/;
  
  const extnameCheck = allowedFileExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  const mimetypeCheck = allowedFileExtensions.test(file.mimetype);

  if (extnameCheck && mimetypeCheck) {
    cb(null, true);
  } else {
    cb(new Error('Security Validation Error: Only standard PDF, JPEG, JPG, and PNG documents are allowed for digitization.'));
  }
};

// 3. Initialize Multer instance with 50MB file size limit
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 4. Secure POST route (requires valid Admin JWT token credentials)
router.post(
  '/upload',
  protect,
  restrictTo('Admin'),
  (req, res, next) => {
    // Custom error handler inside upload execution to intercept Multer exceptions
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadDocument
);

// 5. Search Documents route (Protected)
router.get('/search', protect, searchDocuments);

// 6. Download Document route (Protected, RBAC verified inside controller)
router.get('/:id/download', protect, downloadDocument);

module.exports = router;
