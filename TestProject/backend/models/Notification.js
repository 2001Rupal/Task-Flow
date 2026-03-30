const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'task_assigned', 'task_status_changed', 'comment_added', 'mentioned',
  'due_date_approaching', 'project_member_added', 'project_member_removed', 'workspace_invite'
];

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: NOTIFICATION_TYPES, required: true },
  title:   { type: String, required: true, maxlength: 200 },
  body:    { type: String, maxlength: 500, default: '' },
  link:    { type: String, default: null },
  read:    { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
