const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  resourceType: {
    type: String,
    enum: ['todo', 'list', 'attachment'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast lookups
shareLinkSchema.index({ token: 1 }, { unique: true });
shareLinkSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('ShareLink', shareLinkSchema);
