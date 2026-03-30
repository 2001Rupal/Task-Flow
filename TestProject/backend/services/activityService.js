const Activity = require('../models/Activity');
const socketService = require('./socketService');
const Todo = require('../models/Todo');
const List = require('../models/List');

const ACTION_MESSAGES = {
  created:             (u, o, n) => `${u} created this task`,
  status_changed:      (u, o, n) => `${u} changed status from "${o}" to "${n}"`,
  assigned:            (u, o, n) => n ? `${u} assigned to ${n}` : `${u} unassigned ${o}`,
  unassigned:          (u, o, n) => `${u} unassigned ${o}`,
  priority_changed:    (u, o, n) => `${u} changed priority from ${o} to ${n}`,
  due_date_changed:    (u, o, n) => n ? `${u} set due date to ${n}` : `${u} removed due date`,
  subtask_added:       (u, o, n) => `${u} added subtask: ${n}`,
  subtask_completed:   (u, o, n) => `${u} completed subtask: ${n}`,
  attachment_added:    (u, o, n) => `${u} attached ${n}`,
  attachment_removed:  (u, o, n) => `${u} removed attachment ${n}`,
  watcher_added:       (u, o, n) => `${u} added ${n} as watcher`,
  watcher_removed:     (u, o, n) => `${u} removed ${n} as watcher`,
  tag_added:           (u, o, n) => `${u} added tag: ${n}`,
  tag_removed:         (u, o, n) => `${u} removed tag: ${n}`,
  commented:           (u, o, n) => `${u} added a comment`,
  updated:             (u, o, n) => `${u} updated the task`
};

const logActivity = async (taskId, userId, action, oldValue = null, newValue = null, field = null) => {
  try {
    const activity = await Activity.create({ taskId, userId, action, field, oldValue, newValue });

    // Emit real-time event to project room
    const populated = await Activity.findById(activity._id).populate('userId', 'email displayName avatarColor');
    const task = await Todo.findById(taskId).select('listId');
    if (task) {
      const project = await List.findById(task.listId).select('_id');
      if (project) {
        socketService.emitToProject(project._id.toString(), 'activity:new', { activity: populated });
      }
    }

    return populated;
  } catch (err) {
    console.error('activityService.logActivity error:', err.message);
    return null;
  }
};

const formatMessage = (action, userName, oldValue, newValue) => {
  const fn = ACTION_MESSAGES[action];
  return fn ? fn(userName, oldValue, newValue) : `${userName} performed ${action}`;
};

module.exports = { logActivity, formatMessage };
