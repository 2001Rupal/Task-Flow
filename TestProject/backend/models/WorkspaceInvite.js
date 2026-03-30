const mongoose = require('mongoose');

const workspaceInviteSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  email:       { type: String, required: true, lowercase: true },
  role:        { type: String, enum: ['Admin', 'Member'], required: true },
  token:       { type: String, required: true, unique: true },
  invitedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  expiresAt:   { type: Date, required: true }
}, { timestamps: true });

workspaceInviteSchema.index({ token: 1 }, { unique: true });
workspaceInviteSchema.index({ workspaceId: 1, email: 1 });

module.exports = mongoose.model('WorkspaceInvite', workspaceInviteSchema);
