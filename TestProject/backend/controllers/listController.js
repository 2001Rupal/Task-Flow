const List = require('../models/List');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const ShareLink = require('../models/ShareLink');
const ProjectStatus = require('../models/ProjectStatus');
const Activity = require('../models/Activity');
const Attachment = require('../models/Attachment');
const CustomField = require('../models/CustomField');
const CustomFieldValue = require('../models/CustomFieldValue');
const WorkspaceMember = require('../models/WorkspaceMember');
const Comment = require('../models/Comment');
const path = require('path');
const fs = require('fs');

const DEFAULT_STATUSES = [
  { name: 'To Do',       color: '#94a3b8', order: 0, isDefault: true },
  { name: 'In Progress', color: '#6366f1', order: 1, isDefault: true },
  { name: 'Done',        color: '#10b981', order: 2, isDefault: true }
];

// ── Create project ────────────────────────────
const createList = async (req, res, next) => {
  try {
    const { name, workspaceId, color, icon, description, startDate, endDate } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Project name is required' });
    if (name.length > 100) return res.status(400).json({ error: 'Name must be 100 characters or less' });
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

    // Verify user is workspace member (BR-3.2)
    const wsMember = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!wsMember) return res.status(403).json({ error: 'You are not a member of this workspace' });

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const list = await List.create({
      name: name.trim(),
      workspaceId,
      ownerId: userId,
      color: color || '#6366f1',
      icon: icon || '📋',
      description: description || '',
      startDate: startDate || null,
      endDate: endDate || null
    });

    // Owner collaboration (BR-3.3)
    await Collaboration.create({ listId: list._id, userId, role: 'Owner', invitedBy: userId });

    // Seed default statuses (BR-4.1)
    await ProjectStatus.insertMany(DEFAULT_STATUSES.map(s => ({ ...s, projectId: list._id })));

    res.status(201).json({ list });
  } catch (err) { next(err); }
};

// ── Get projects (optionally filtered by workspace) ──
const getLists = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.query;

    const collabFilter = { userId };
    let collaborations = await Collaboration.find(collabFilter).populate('listId');

    let lists = collaborations
      .filter(c => c.listId)
      .map(c => ({ ...c.listId.toObject(), role: c.role }));

    if (workspaceId) {
      lists = lists.filter(l => l.workspaceId && l.workspaceId.toString() === workspaceId);
    }

    res.json({ lists });
  } catch (err) { next(err); }
};

// ── Get project by ID ─────────────────────────
const getListById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const collab = await Collaboration.findOne({ listId: id, userId }).populate('listId');
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const statuses = await ProjectStatus.find({ projectId: id }).sort({ order: 1 });
    const members = await Collaboration.find({ listId: id, status: 'active' })
      .populate('userId', 'email displayName avatarColor');

    res.json({ list: collab.listId, role: collab.role, statuses, members });
  } catch (err) { next(err); }
};

// ── Update project ────────────────────────────
const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, icon, description, status, startDate, endDate } = req.body;
    const userId = req.user.userId;

    const collab = await Collaboration.findOne({ listId: id, userId });
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    if (collab.role === 'Viewer') return res.status(403).json({ error: 'Viewers cannot update projects' });

    const update = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      update.name = name.trim();
    }
    if (color !== undefined) update.color = color;
    if (icon !== undefined) update.icon = icon;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (startDate !== undefined) update.startDate = startDate || null;
    if (endDate !== undefined) update.endDate = endDate || null;

    if (update.startDate && update.endDate && new Date(update.startDate) > new Date(update.endDate)) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const list = await List.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!list) return res.status(404).json({ error: 'Project not found' });

    res.json({ list });
  } catch (err) { next(err); }
};

// ── Delete project ────────────────────────────
const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const collab = await Collaboration.findOne({ listId: id, userId });
    if (!collab || collab.role !== 'Owner') return res.status(403).json({ error: 'Only project owner can delete' });

    // Cascade delete (BR-3.5)
    const tasks = await Todo.find({ listId: id }).select('_id');
    const taskIds = tasks.map(t => t._id);

    // Delete attachment files from disk
    const attachments = await Attachment.find({ taskId: { $in: taskIds } });
    for (const att of attachments) {
      const filePath = path.join(__dirname, '..', 'uploads', att.filename);
      fs.unlink(filePath, () => {});
    }

    await Attachment.deleteMany({ taskId: { $in: taskIds } });
    await Comment.deleteMany({ todoId: { $in: taskIds } });
    await Activity.deleteMany({ taskId: { $in: taskIds } });
    await CustomFieldValue.deleteMany({ taskId: { $in: taskIds } });
    await Todo.deleteMany({ listId: id });
    await Collaboration.deleteMany({ listId: id });
    await ShareLink.deleteMany({ resourceType: 'list', resourceId: id });
    await ProjectStatus.deleteMany({ projectId: id });
    await CustomField.deleteMany({ projectId: id });
    await List.findByIdAndDelete(id);

    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

// ── Project stats ─────────────────────────────
const getProjectStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collab = await Collaboration.findOne({ listId: id, userId: req.user.userId });
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const [total, completed, overdue] = await Promise.all([
      Todo.countDocuments({ listId: id }),
      Todo.countDocuments({ listId: id, status: 'Done' }),
      Todo.countDocuments({ listId: id, dueDate: { $lt: new Date() }, status: { $ne: 'Done' } })
    ]);

    res.json({ stats: { total, completed, overdue, inProgress: total - completed } });
  } catch (err) { next(err); }
};

// ── Project analytics ─────────────────────────
const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collab = await Collaboration.findOne({ listId: id, userId: req.user.userId });
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const tasks = await Todo.find({ listId: id })
      .populate('assignedTo', 'email displayName avatarColor');

    // Tasks by status
    const tasksByStatus = {};
    // Tasks by priority
    const tasksByPriority = {};
    // Tasks by assignee
    const tasksByAssignee = {};
    // Time tracking by assignee
    const timeTracking = {};
    // Completion over time (last 30 days)
    const completionMap = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const task of tasks) {
      // By status
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      // By priority
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;

      // By assignee
      if (task.assignedTo) {
        const key = task.assignedTo._id.toString();
        if (!tasksByAssignee[key]) {
          tasksByAssignee[key] = { userId: key, email: task.assignedTo.email, displayName: task.assignedTo.displayName, count: 0 };
          timeTracking[key] = { userId: key, email: task.assignedTo.email, estimatedHours: 0, loggedHours: 0 };
        }
        tasksByAssignee[key].count++;
        timeTracking[key].estimatedHours += task.estimatedHours || 0;
        timeTracking[key].loggedHours += task.loggedHours || 0;
      }

      // Completion over time
      if (task.completedAt && task.completedAt >= thirtyDaysAgo) {
        const day = task.completedAt.toISOString().split('T')[0];
        completionMap[day] = (completionMap[day] || 0) + 1;
      }
    }

    res.json({
      analytics: {
        tasksByStatus,
        tasksByPriority,
        tasksByAssignee: Object.values(tasksByAssignee),
        timeTracking: Object.values(timeTracking),
        completionOverTime: Object.entries(completionMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
      }
    });
  } catch (err) { next(err); }
};

module.exports = {
  createList, getLists, getListById, updateList, deleteList,
  getProjectStats, getProjectAnalytics
};
