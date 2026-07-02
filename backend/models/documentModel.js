const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    firNumber: {
      type: String,
      required: [true, 'FIR Number is required'],
      trim: true
    },
    caseNumber: {
      type: String,
      required: [true, 'Case Number is required'],
      trim: true
    },
    policeStation: {
      type: String,
      required: [true, 'Police Station name is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Filing Year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Invalid filing year']
    },
    recordType: {
      type: String,
      required: [true, 'Record Type is required'],
      enum: {
        values: ['FIR', 'Case Diary', 'Administrative Order', 'Charge Sheet', 'General Diary', 'Other'],
        message: 'Invalid Record Type'
      }
    },
    keywords: {
      type: [String],
      default: []
    },
    filePath: {
      type: String,
      required: [true, 'File upload path is required']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader identity reference is required']
    },
    qualityCheckStatus: {
      type: String,
      enum: ['Pending', 'Passed', 'Failed'],
      default: 'Pending'
    },
    digitalSignature: {
      type: String,
      required: [true, 'Digital signature hash is required']
    },
    isEncrypted: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Document', documentSchema);
