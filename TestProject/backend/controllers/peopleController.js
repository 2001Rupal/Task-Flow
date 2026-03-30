const WorkspaceMember = require('../models/WorkspaceMember');
const Collaboration = require('../models/Collaboration');
const Todo = require('../models/Todo');
const List = require('../models/List');
const User = require('../models/User');

// GET /api/workspaces/:id/people
// Returns all workspace members enriched with task stats
const getWorkspacePeople = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.userId;

    const requester = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!requester) return res.status(403).json({ error: 'Access denied' });

    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'email displayName avatarColor createdAt');

    const projects = await List.find({ workspaceId }).select('_id name');
    const projectIds = projects.map(p => p._id);

    const people = await Promise.all(members.map(async (m) => {
      const uid = m.userId?._id;
      if (!uid) return null;

      // Tasks assigned to this person across all workspace projects
      const [assignedTasks, completedTasks, overdueTasks] = await Promise.all([
        Todo.countDocuments({ listId: { $in: projectIds }, assignedTo: uid, status: { $ne: 'Done' } }),
        Todo.countDocuments({ listId: { $in: projectIds }, assignedTo: uid, status: 'Done' }),
        Todo.countDocuments({
          listId: { $in: projectIds },
          assignedTo: uid,
          status: { $ne: 'Done' },
          dueDate: { $lt: new Date() }
        })
      ]);

      // Projects this person is on
      const memberProjects = await Collaboration.find({
        listId: { $in: projectIds },
        userId: uid,
        status: 'active'
      }).select('listId role');

      const projectDetails = memberProjects.map(c => {
        const proj = projects.find(p => p._id.toString() === c.listId.toString());
        return proj ? { _id: proj._id, name: proj.name, role: c.role } : null
      }).filter(Boolean);

      return {
        userId: uid,
        email: m.userId.email,
        displayName: m.userId.displayName,
        avatarColor: m.userId.avatarColor,
        workspaceRole: m.role,
        joinedAt: m.joinedAt,
        stats: { assignedTasks, completedTasks, overdueTasks },
        projects: projectDetails
      };
    }));

    res.json({ people: people.filter(Boolean) });
  } catch (err) { next(err); }
};

// GET /api/workspaces/:id/people/:userId/tasks
// Returns tasks assigned to a specific member
const getMemberTasks = async (req, res, next) => {
  try {
    const { id: workspaceId, userId: memberId } = req.params;
    const requesterId = req.user.userId;

    const requester = await WorkspaceMember.findOne({ workspaceId, userId: requesterId });
    if (!requester) return res.status(403).json({ error: 'Access denied' });

    const projects = await List.find({ workspaceId }).select('_id name');
    const projectIds = projects.map(p => p._id);

    const tasks = await Todo.find({
      listId: { $in: projectIds },
      assignedTo: memberId
    })
      .populate('listId', 'name icon')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(50);

    res.json({ tasks });
  } catch (err) { next(err); }
};

module.exports = { getWorkspacePeople, getMemberTasks };
