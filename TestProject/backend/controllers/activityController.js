const Activity = require('../models/Activity');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const WorkspaceMember = require('../models/WorkspaceMember');
const List = require('../models/List');

// ── Get activity for a task ───────────────────
const getTaskActivity = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Todo.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check project collaboration OR workspace membership
    const collab = await Collaboration.findOne({ listId: task.listId, userId: req.user.userId });
    if (!collab) {
      const project = await List.findById(task.listId).select('workspaceId');
      const wsMember = project && await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: req.user.userId });
      if (!wsMember) return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await Activity.find({ taskId })
      .sort({ createdAt: -1 })
      .populate('userId', 'email displayName avatarColor')
      .limit(200);

    res.json({ activities });
  } catch (err) { next(err); }
};

module.exports = { getTaskActivity };
