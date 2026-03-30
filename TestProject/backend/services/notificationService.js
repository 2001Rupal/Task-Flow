const Notification = require('../models/Notification');
const User = require('../models/User');
const socketService = require('./socketService');
const emailService = require('./emailService');

const MAX_NOTIFICATIONS = 500;

/**
 * Core: create a notification, emit via socket, optionally send email.
 */
const createNotification = async (userId, type, title, body, link, payload) => {
  try {
    const user = await User.findById(userId).select('email notificationPreferences');
    if (!user) return;

    const prefs = user.notificationPreferences || {};
    const prefKey = prefKeyForType(type);
    const pref = prefs[prefKey] || { inApp: true, email: false };

    if (pref.inApp) {
      const notif = await Notification.create({ userId, type, title, body, link, payload });
      socketService.emitToUser(userId.toString(), 'notification:new', notif);

      // Prune oldest if over limit
      const count = await Notification.countDocuments({ userId });
      if (count > MAX_NOTIFICATIONS) {
        const oldest = await Notification.find({ userId })
          .sort({ createdAt: 1 })
          .limit(count - MAX_NOTIFICATIONS)
          .select('_id');
        await Notification.deleteMany({ _id: { $in: oldest.map(n => n._id) } });
      }
    }

    if (pref.email) {
      emailService.sendNotificationEmail(user.email, type, { title, body, link, payload })
        .catch(err => console.error('Notification email error:', err.message));
    }
  } catch (err) {
    console.error('notificationService.createNotification error:', err.message);
  }
};

const prefKeyForType = (type) => {
  const map = {
    task_assigned:         'taskAssigned',
    task_status_changed:   'taskStatusChanged',
    comment_added:         'commentAdded',
    mentioned:             'mentioned',
    due_date_approaching:  'dueDateApproaching',
    project_member_added:  'memberChanges',
    project_member_removed:'memberChanges',
    workspace_invite:      'memberChanges'
  };
  return map[type] || 'projectUpdates';
};

const notifyTaskAssigned = async (task, assignedToId, assignerUser) => {
  if (!assignedToId) return;
  if (assignedToId.toString() === assignerUser.userId.toString()) return;
  await createNotification(
    assignedToId,
    'task_assigned',
    `You were assigned: "${task.title}"`,
    `Assigned by ${assignerUser.email}`,
    `/tasks/${task._id}`,
    { taskId: task._id, projectId: task.listId }
  );
};

const notifyTaskStatusChanged = async (task, changedByUserId, oldStatus, newStatus) => {
  const recipients = new Set();
  if (task.assignedTo) recipients.add(task.assignedTo.toString());
  (task.watchers || []).forEach(w => recipients.add(w.toString()));
  recipients.delete(changedByUserId.toString());

  for (const uid of recipients) {
    await createNotification(
      uid,
      'task_status_changed',
      `Task status changed: "${task.title}"`,
      `Status changed from "${oldStatus}" to "${newStatus}"`,
      `/tasks/${task._id}`,
      { taskId: task._id, projectId: task.listId, oldStatus, newStatus }
    );
  }
};

const notifyCommentAdded = async (comment, task, commenterUser) => {
  const recipients = new Set();
  if (task.assignedTo) recipients.add(task.assignedTo.toString());
  (task.watchers || []).forEach(w => recipients.add(w.toString()));
  recipients.delete(commenterUser.userId.toString());

  for (const uid of recipients) {
    await createNotification(
      uid,
      'comment_added',
      `New comment on: "${task.title}"`,
      `${commenterUser.email} commented`,
      `/tasks/${task._id}`,
      { taskId: task._id, projectId: task.listId }
    );
  }
};

const notifyMentioned = async (mentionedUserId, commenterUser, task) => {
  if (mentionedUserId.toString() === commenterUser.userId.toString()) return;
  await createNotification(
    mentionedUserId,
    'mentioned',
    `You were mentioned in: "${task.title}"`,
    `${commenterUser.email} mentioned you`,
    `/tasks/${task._id}`,
    { taskId: task._id, projectId: task.listId }
  );
};

const notifyWorkspaceInvite = async (invitedEmail, inviterUser, workspace, inviteLink) => {
  // For workspace invites, we find user by email if they exist
  const user = await User.findOne({ email: invitedEmail });
  if (user) {
    await createNotification(
      user._id,
      'workspace_invite',
      `You've been invited to workspace: "${workspace.name}"`,
      `Invited by ${inviterUser.email}`,
      inviteLink,
      { workspaceId: workspace._id }
    );
  }
};

module.exports = {
  createNotification,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyCommentAdded,
  notifyMentioned,
  notifyWorkspaceInvite
};
