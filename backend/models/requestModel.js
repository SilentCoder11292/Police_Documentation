const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required']
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested user reference is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: 'Request status must be Pending, Approved, or Rejected'
      },
      default: 'Pending'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate pending or approved requests for the same user and document
requestSchema.index({ document: 1, requestedBy: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
