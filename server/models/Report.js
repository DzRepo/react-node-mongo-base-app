const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['discussion', 'comment'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual to populate the referenced content
reportSchema.virtual('content', {
  refPath: 'contentType',
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

// Add index for queries
reportSchema.index({ contentType: 1, contentId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reportedBy: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 