const mongoose = require('mongoose');

const projectStatusUpdateSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['on-track', 'at-risk', 'off-track'], required: true },
  title:     { type: String, maxlength: 200, default: '' },
  body:      { type: String, maxlength: 5000, default: '' },
}, { timestamps: true });

projectStatusUpdateSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectStatusUpdate', projectStatusUpdateSchema);
