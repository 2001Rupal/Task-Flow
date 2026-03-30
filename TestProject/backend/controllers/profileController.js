const User = require('../models/User');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const WorkspaceMember = require('../models/WorkspaceMember');
const List = require('../models/List');


const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatarColor, notificationPreferences } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (displayName !== undefined) user.displayName = displayName.trim().slice(0, 50);
    if (avatarColor) user.avatarColor = avatarColor;
    if (notificationPreferences) user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
    await user.save();
    res.json({ user: { _id: user._id, email: user.email, displayName: user.displayName, avatarColor: user.avatarColor, notificationPreferences: user.notificationPreferences } });
  } catch (e) { next(e); }
};

// Get all tasks assigned to the current user across all lists
const getMyWork = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, priority } = req.query;

    const filter = { assignedTo: userId };
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;

    const todos = await Todo.find(filter)
      .populate('listId', 'name')
      .populate('assignedTo', 'email displayName avatarColor')
      .populate('tags', 'name color')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(200);

    res.json({ todos });
  } catch (e) { next(e); }
};


// ── Workload balancing ────────────────────────
async function getWorkload(req, res, next) {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

    // Verify requester is workspace member
    const requesterMember = await WorkspaceMember.findOne({ workspaceId, userId: req.user.userId });
    if (!requesterMember) return res.status(403).json({ error: 'Access denied' });

    // Get all projects in workspace
    const projects = await List.find({ workspaceId }).select('_id');
    const projectIds = projects.map(p => p._id);

    // Get all active members across all projects
    const collabs = await Collaboration.find({
      listId: { $in: projectIds },
      status: 'active',
      userId: { $ne: null }
    }).populate('userId', 'email displayName avatarColor');

    // Unique members
    const memberMap = {};
    for (const c of collabs) {
      if (c.userId) memberMap[c.userId._id.toString()] = c.userId;
    }

    const threshold = {
      tasks: parseInt(process.env.WORKLOAD_TASK_THRESHOLD) || 10,
      hours: parseInt(process.env.WORKLOAD_HOUR_THRESHOLD) || 40
    };

    const workload = await Promise.all(
      Object.entries(memberMap).map(async ([uid, user]) => {
        const activeTasks = await Todo.find({
          listId: { $in: projectIds },
          assignedTo: uid,
          status: { $ne: 'Done' }
        }).select('estimatedHours');

        const taskCount = activeTasks.length;
        const estimatedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const isOverloaded = taskCount >= threshold.tasks || estimatedHours >= threshold.hours;

        return {
          userId: uid,
          email: user.email,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
          taskCount,
          estimatedHours,
          isOverloaded
        };
      })
    );

    res.json({ workload, threshold });
  } catch (e) { next(e); }
}

module.exports = { getProfile, updateProfile, getMyWork, getWorkload };
