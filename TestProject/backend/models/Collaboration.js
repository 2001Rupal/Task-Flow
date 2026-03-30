const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null   // null for pending invites
  },
  role: {
    type: String,
    enum: ['Owner', 'Editor', 'Viewer'],
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'pending'],
    default: 'active'
  },
  inviteEmail:  { type: String, default: null },
  inviteToken:  { type: String, default: null }
});

collaborationSchema.index({ listId: 1, userId: 1 }, { unique: true, sparse: true });
collaborationSchema.index({ userId: 1 });
collaborationSchema.index({ inviteToken: 1 });

module.exports = mongoose.model('Collaboration', collaborationSchema);
