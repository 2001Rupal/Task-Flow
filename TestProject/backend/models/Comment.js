const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji:   { type: String, required: true },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const commentSchema = new mongoose.Schema({
  todoId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  text:     { type: String, default: '', maxlength: 10000 },
  mentions:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  reactions:   [reactionSchema],
  seenBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pinned:      { type: Boolean, default: false },
  pinnedAt:    { type: Date, default: null },
  editedAt:    { type: Date, default: null }
}, { timestamps: true });

commentSchema.index({ todoId: 1, createdAt: 1 });
commentSchema.index({ todoId: 1, pinned: -1 });

module.exports = mongoose.model('Comment', commentSchema);
