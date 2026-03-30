/**
 * Recurring Task Service
 * When a recurring task is marked Done, auto-creates the next occurrence.
 */
const Todo = require('../models/Todo');
const activityService = require('./activityService');

const INTERVAL_DAYS = { daily: 1, weekly: 7, monthly: 30 };

/**
 * Called after a task is saved with status === 'Done'.
 * If the task has a recurrence, clone it with a new due date and reset status.
 */
async function handleRecurringTask(completedTask) {
  try {
    const { recurrence, dueDate, listId, title, description, priority,
            assignedTo, watchers, tags, estimatedHours, blockedBy } = completedTask;

    if (!recurrence || recurrence === 'none') return;

    const days = INTERVAL_DAYS[recurrence];
    if (!days) return;

    // Calculate next due date
    const base = dueDate ? new Date(dueDate) : new Date();
    const nextDue = new Date(base);
    nextDue.setDate(nextDue.getDate() + days);

    const next = new Todo({
      listId,
      title,
      description,
      status: 'To Do',
      priority,
      assignedTo: assignedTo || null,
      watchers: watchers || [],
      tags: tags || [],
      estimatedHours: estimatedHours || null,
      loggedHours: 0,
      recurrence,
      blockedBy: blockedBy || [],
      dueDate: nextDue,
    });

    await next.save();
    await activityService.logActivity(
      next._id,
      assignedTo || null,
      'created',
      null,
      `Auto-created from recurring task: ${title}`
    );

    return next;
  } catch (err) {
    console.error('[recurringTaskService] Error creating next occurrence:', err.message);
  }
}

module.exports = { handleRecurringTask };
