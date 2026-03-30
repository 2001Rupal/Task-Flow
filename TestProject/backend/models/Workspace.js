const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name:        { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500, default: '' },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

workspaceSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
