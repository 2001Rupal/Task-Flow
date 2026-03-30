const Todo = require('../models/Todo');
const List = require('../models/List');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Collaboration = require('../models/Collaboration');
const ShareLink = require('../models/ShareLink');
const Attachment = require('../models/Attachment');
const Activity = require('../models/Activity');
const ProjectStatus = require('../models/ProjectStatus');
const WorkspaceMember = require('../models/WorkspaceMember');
const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');
const emailService = require('../services/emailService');
const { handleRecurringTask } = require('../services/recurringTaskService');
const path = require('path');
const fs = require('fs');

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

async function checkAccess(listId, userId) {
  return Collaboration.findOne({ listId, userId, status: 'active' });
}

function populateTodo(query) {
  return query
    .populate('assignedTo', 'email displayName avatarColor')
    .populate('watchers', 'email displayName avatarColor')
    .populate('tags', 'name color')
    .populate('blockedBy', 'title status');
}

// ── Create task ───────────────────────────────
const createTodo = async (req, res, next) => {
  try {
    const {
      listId, title, description, dueDate, startDate,
      priority, assignedTo, watchers, tags, estimatedHours, recurrence, blockedBy, status
    } = req.body;
    const userId = req.user.userId;

    if (!listId) return res.status(400).json({ error: 'List ID is required' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const collab = await checkAccess(listId, userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    if (collab.role === 'Viewer') return res.status(403).json({ error: 'Viewers cannot create tasks' });

    // Validate status against project statuses
    let taskStatus = 'To Do';
    if (status) {
      const validStatus = await ProjectStatus.findOne({ projectId: listId, name: status });
      if (validStatus) taskStatus = status;
    }

    // Validate dates
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      return res.status(400).json({ error: 'startDate must be before dueDate' });
    }

    const todo = new Todo({
      listId,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: taskStatus,
      dueDate: dueDate || null,
      startDate: startDate || null,
      priority: VALID_PRIORITIES.includes(priority) ? priority : 'Medium',
      assignedTo: assignedTo || null,
      watchers: watchers || [],
      tags: tags || [],
      estimatedHours: estimatedHours || null,
      recurrence: recurrence || 'none',
      blockedBy: blockedBy || []
    });

    await todo.save();

    await activityService.logActivity(todo._id, userId, 'created', null, todo.title);

    if (assignedTo) {
      await notificationService.notifyTaskAssigned(todo, assignedTo, req.user);
      try {
        const [assignee, list] = await Promise.all([
          User.findById(assignedTo).select('email'),
          List.findById(listId).select('name')
        ]);
        if (assignee && list) {
          emailService.sendTaskAssignment(
            assignee.email, req.user.email, todo.title,
            list.name, todo.dueDate, todo.priority, process.env.APP_URL
          ).catch(() => {});
        }
      } catch (_) {}
    }

    const populated = await populateTodo(Todo.findById(todo._id));
    socketService.emitToProject(listId, 'task:created', populated);
    res.status(201).json({ todo: populated });
  } catch (e) { next(e); }
};

// ── Get by list ───────────────────────────────
const getTodosByList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const collab = await checkAccess(listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const todos = await populateTodo(
      Todo.find({ listId }).sort({ order: 1, createdAt: -1 })
    );
    res.json({ todos });
  } catch (e) { next(e); }
};

// ── Get by ID ─────────────────────────────────
const getTodoById = async (req, res, next) => {
  try {
    const todo = await populateTodo(Todo.findById(req.params.id));
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    res.json({ todo });
  } catch (e) { next(e); }
};

// ── Update task ───────────────────────────────
const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, status, dueDate, startDate,
      priority, assignedTo, watchers, tags, estimatedHours, loggedHours,
      recurrence, blockedBy, order
    } = req.body;
    const userId = req.user.userId;

    const todo = await Todo.findById(id).populate('assignedTo', 'email _id');
    if (!todo) return res.status(404).json({ error: 'Task not found' });

    const collab = await checkAccess(todo.listId, userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    if (collab.role === 'Viewer') return res.status(403).json({ error: 'Viewers cannot update tasks' });

    const prevAssigneeId    = todo.assignedTo ? todo.assignedTo._id.toString() : null;
    const prevAssigneeEmail = todo.assignedTo ? todo.assignedTo.email : null;
    const prevStatus        = todo.status;

    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();

    if (status !== undefined && status !== todo.status) {
      const validStatus = await ProjectStatus.findOne({ projectId: todo.listId, name: status });
      if (!validStatus) return res.status(400).json({ error: `Invalid status: ${status}` });
      await activityService.logActivity(id, userId, 'status_changed', prevStatus, status, 'status');
      todo.status = status;
      // Handle completedAt (BR-5.8, BR-5.9)
      if (status.toLowerCase() === 'done') {
        todo.completedAt = new Date();
      } else {
        todo.completedAt = null;
      }
      await notificationService.notifyTaskStatusChanged(todo, userId, prevStatus, status);
    }

    if (priority !== undefined && VALID_PRIORITIES.includes(priority) && priority !== todo.priority) {
      await activityService.logActivity(id, userId, 'priority_changed', todo.priority, priority, 'priority');
      todo.priority = priority;
    }

    if (dueDate !== undefined) {
      const oldDue = todo.dueDate ? todo.dueDate.toISOString() : null;
      const newDue = dueDate || null;
      if (oldDue !== newDue) {
        await activityService.logActivity(id, userId, 'due_date_changed', oldDue, newDue, 'dueDate');
      }
      todo.dueDate = newDue;
    }

    if (startDate !== undefined) todo.startDate = startDate || null;

    if (assignedTo !== undefined) {
      const newId  = assignedTo || null;
      const newStr = newId ? newId.toString() : null;
      if (newStr !== prevAssigneeId) {
        await activityService.logActivity(id, userId, newId ? 'assigned' : 'unassigned', prevAssigneeEmail, newStr, 'assignedTo');
        todo.assignedTo = newId;
        try {
          const list = await List.findById(todo.listId).select('name');
          const listName = list ? list.name : '';
          if (prevAssigneeId && prevAssigneeId !== newStr) {
            emailService.sendTaskReassigned(prevAssigneeEmail, req.user.email, todo.title, listName, newStr ? (await User.findById(newId).select('email'))?.email : null).catch(() => {});
          }
          if (newId && newStr !== prevAssigneeId) {
            const newUser = await User.findById(newId).select('email');
            if (newUser) {
              emailService.sendTaskAssignment(newUser.email, req.user.email, todo.title, listName, todo.dueDate, todo.priority, process.env.APP_URL).catch(() => {});
              await notificationService.notifyTaskAssigned(todo, newId, req.user);
            }
          }
        } catch (_) {}
      }
    }

    if (watchers !== undefined) todo.watchers = watchers;
    if (tags !== undefined) todo.tags = tags;
    if (estimatedHours !== undefined) todo.estimatedHours = estimatedHours;
    if (loggedHours !== undefined) todo.loggedHours = Math.max(0, loggedHours);
    if (recurrence !== undefined) todo.recurrence = recurrence;
    if (blockedBy !== undefined) todo.blockedBy = blockedBy;
    if (order !== undefined) todo.order = order;

    await todo.save();

    // If task was just completed and has recurrence, spawn next occurrence
    if (status !== undefined && status.toLowerCase() === 'done' && todo.recurrence && todo.recurrence !== 'none') {
      const next = await handleRecurringTask(todo);
      if (next) socketService.emitToProject(todo.listId.toString(), 'task:created', next);
    }

    const populated = await populateTodo(Todo.findById(id));
    socketService.emitToProject(todo.listId.toString(), 'task:updated', populated);
    res.json({ todo: populated });
  } catch (e) { next(e); }
};

// ── Delete task ───────────────────────────────
const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    if (collab.role === 'Viewer') return res.status(403).json({ error: 'Viewers cannot delete tasks' });

    // Delete attachment files from disk (BR-6.6)
    const attachments = await Attachment.find({ taskId: id });
    for (const att of attachments) {
      const filePath = path.join(__dirname, '..', 'uploads', att.filename);
      fs.unlink(filePath, () => {});
    }

    await Attachment.deleteMany({ taskId: id });
    await ShareLink.deleteMany({ resourceType: 'todo', resourceId: id });
    await Comment.deleteMany({ todoId: id });
    await Activity.deleteMany({ taskId: id });
    await Todo.findByIdAndDelete(id);

    socketService.emitToProject(todo.listId.toString(), 'task:deleted', { taskId: id });
    res.json({ message: 'Task deleted' });
  } catch (e) { next(e); }
};

// ── Subtasks ──────────────────────────────────
const addSubtask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Subtask title required' });

    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    if (todo.subtasks.length >= 50) return res.status(400).json({ error: 'Maximum 50 subtasks per task' });

    todo.subtasks.push({ title: title.trim() });
    await todo.save();
    await activityService.logActivity(id, req.user.userId, 'subtask_added', null, title.trim());
    res.json({ subtasks: todo.subtasks });
  } catch (e) { next(e); }
};

const updateSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;
    const { title, completed } = req.body;

    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    const sub = todo.subtasks.id(subtaskId);
    if (!sub) return res.status(404).json({ error: 'Subtask not found' });
    if (title !== undefined) sub.title = title.trim();
    if (completed !== undefined) {
      sub.completed = completed;
      sub.completedAt = completed ? new Date() : null;
      if (completed) await activityService.logActivity(id, req.user.userId, 'subtask_completed', null, sub.title);
    }
    await todo.save();
    res.json({ subtasks: todo.subtasks });
  } catch (e) { next(e); }
};

const deleteSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;
    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    todo.subtasks.pull({ _id: subtaskId });
    await todo.save();
    res.json({ subtasks: todo.subtasks });
  } catch (e) { next(e); }
};

// ── Watchers ──────────────────────────────────
const addWatcher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId: watcherId } = req.body;
    const actorId = req.user.userId;

    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, actorId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    // Watcher must be project member (BR-5.7)
    const watcherCollab = await Collaboration.findOne({ listId: todo.listId, userId: watcherId, status: 'active' });
    if (!watcherCollab) return res.status(400).json({ error: 'Watcher must be a project member' });

    if (!todo.watchers.map(w => w.toString()).includes(watcherId)) {
      todo.watchers.push(watcherId);
      await todo.save();
      const watcher = await User.findById(watcherId).select('email displayName');
      await activityService.logActivity(id, actorId, 'watcher_added', null, watcher?.email || watcherId);
    }

    const populated = await populateTodo(Todo.findById(id));
    res.json({ watchers: populated.watchers });
  } catch (e) { next(e); }
};

const removeWatcher = async (req, res, next) => {
  try {
    const { id, watcherId } = req.params;
    const actorId = req.user.userId;

    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(todo.listId, actorId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    todo.watchers = todo.watchers.filter(w => w.toString() !== watcherId);
    await todo.save();
    await activityService.logActivity(id, actorId, 'watcher_removed', watcherId, null);

    const populated = await populateTodo(Todo.findById(id));
    res.json({ watchers: populated.watchers });
  } catch (e) { next(e); }
};

// ── Bulk operations ───────────────────────────
const bulkUpdate = async (req, res, next) => {
  try {
    const { ids, status, priority, assignedTo, deleteAll } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No task IDs provided' });

    const first = await Todo.findById(ids[0]);
    if (!first) return res.status(404).json({ error: 'Task not found' });
    const collab = await checkAccess(first.listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    if (deleteAll) {
      const tasks = await Todo.find({ _id: { $in: ids } }).select('_id');
      const taskIds = tasks.map(t => t._id);
      const attachments = await Attachment.find({ taskId: { $in: taskIds } });
      for (const att of attachments) {
        const filePath = path.join(__dirname, '..', 'uploads', att.filename);
        fs.unlink(filePath, () => {});
      }
      await Attachment.deleteMany({ taskId: { $in: taskIds } });
      await Comment.deleteMany({ todoId: { $in: ids } });
      await Activity.deleteMany({ taskId: { $in: ids } });
      await Todo.deleteMany({ _id: { $in: ids } });
      return res.json({ message: `${ids.length} tasks deleted` });
    }

    const update = {};
    if (status) update.status = status;
    if (priority && VALID_PRIORITIES.includes(priority)) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;

    await Todo.updateMany({ _id: { $in: ids } }, { $set: update });
    res.json({ message: `${ids.length} tasks updated` });
  } catch (e) { next(e); }
};

// ── Global search ─────────────────────────────
const searchTodos = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ tasks: [] });

    // Collaboration, List already imported at file top; WorkspaceMember imported at top too

    // Get all project IDs the user has access to
    const collabs = await Collaboration.find({ userId: req.user.userId, status: 'active' }).select('listId');
    const collabProjectIds = collabs.map(c => c.listId);

    // Also workspace-level access
    const wsMemberships = await WorkspaceMember.find({ userId: req.user.userId }).select('workspaceId');
    const wsIds = wsMemberships.map(w => w.workspaceId);
    const wsProjects = wsIds.length > 0
      ? await List.find({ workspaceId: { $in: wsIds } }).select('_id')
      : [];
    const wsProjectIds = wsProjects.map(p => p._id);

    const allProjectIds = [...new Set([...collabProjectIds.map(String), ...wsProjectIds.map(String)])];

    const tasks = await Todo.find({
      listId: { $in: allProjectIds },
      title: { $regex: q.trim(), $options: 'i' }
    })
      .populate('listId', 'name color')
      .populate('assignedTo', 'displayName email avatarColor')
      .select('title status priority dueDate listId assignedTo')
      .limit(10)
      .lean();

    res.json({ tasks });
  } catch (e) { next(e); }
};

module.exports = {
  createTodo, getTodosByList, getTodoById, updateTodo, deleteTodo,
  addSubtask, updateSubtask, deleteSubtask,
  addWatcher, removeWatcher,
  bulkUpdate, searchTodos
};
