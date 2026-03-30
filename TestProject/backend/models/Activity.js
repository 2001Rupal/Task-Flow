const mongoose = require('mongoose');

const ACTIVITY_ACTIONS = [
  'created', 'updated', 'commented', 'status_changed', 'assigned', 'unassigned',
  'due_date_changed', 'priority_changed', 'subtask_added', 'subtask_completed',
  'attachment_added', 'attachment_removed', 'watcher_added', 'watcher_removed',
  'tag_added', 'tag_removed'
];

const activitySchema = new mongoose.Schema({
  taskId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:   { type: String, enum: ACTIVITY_ACTIONS, required: true },
  field:    { type: String, default: null },
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

activitySchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
