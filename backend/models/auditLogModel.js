const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Audit action description is required'],
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit operator identity is required']
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false // Handled manually via timestamp property
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
