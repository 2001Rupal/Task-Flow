const WorkspaceMember = require('../models/WorkspaceMember');
const List = require('../models/List');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const ProjectStatus = require('../models/ProjectStatus');

// GET /api/workspaces/:id/portfolio
const getPortfolio = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;

    const member = await WorkspaceMember.findOne({ workspaceId, userId: req.user.userId });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const projects = await List.find({ workspaceId });

    const portfolio = await Promise.all(projects.map(async (p) => {
      const [total, done, overdue, inProgress] = await Promise.all([
        Todo.countDocuments({ listId: p._id }),
        Todo.countDocuments({ listId: p._id, status: 'Done' }),
        Todo.countDocuments({ listId: p._id, status: { $ne: 'Done' }, dueDate: { $lt: new Date() } }),
        Todo.countDocuments({ listId: p._id, status: 'In Progress' }),
      ]);

      // Member count
      const memberCount = await Collaboration.countDocuments({ listId: p._id, status: 'active' });

      // Completion % 
      const completion = total > 0 ? Math.round((done / total) * 100) : 0;

      // Health: red if overdue > 20% of total, yellow if any overdue, green otherwise
      let health = 'on-track'
      if (total > 0 && overdue / total > 0.2) health = 'at-risk'
      else if (overdue > 0) health = 'off-track'

      return {
        _id: p._id,
        name: p.name,
        icon: p.icon,
        color: p.color,
        status: p.status || 'active',
        startDate: p.startDate,
        endDate: p.endDate,
        total,
        done,
        overdue,
        inProgress,
        memberCount,
        completion,
        health,
      };
    }));

    res.json({ portfolio });
  } catch (err) { next(err); }
};

module.exports = { getPortfolio };
