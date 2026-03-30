const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  icon: {
    type: String,
    default: '📋'
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'On Hold'],
    default: 'Active'
  },
  startDate: { type: Date },
  endDate:   { type: Date },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

listSchema.index({ workspaceId: 1 });
listSchema.index({ ownerId: 1 });

module.exports = mongoose.model('List', listSchema);
