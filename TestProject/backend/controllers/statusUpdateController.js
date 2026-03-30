const ProjectStatusUpdate = require('../models/ProjectStatusUpdate');
const Collaboration = require('../models/Collaboration');
const WorkspaceMember = require('../models/WorkspaceMember');
const List = require('../models/List');

async function checkAccess(projectId, userId) {
  const collab = await Collaboration.findOne({ listId: projectId, userId, status: 'active' });
  if (collab) return collab;
  const project = await List.findById(projectId).select('workspaceId');
  if (!project) return null;
  return WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId });
}

// GET /api/projects/:projectId/status-updates
const getStatusUpdates = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const access = await checkAccess(projectId, req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const updates = await ProjectStatusUpdate.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('authorId', 'displayName email avatarColor');

    res.json({ updates });
  } catch (err) { next(err); }
};

// POST /api/projects/:projectId/status-updates
const createStatusUpdate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, title, body } = req.body;
    const userId = req.user.userId;

    const access = await checkAccess(projectId, userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    if (access.role === 'Viewer') return res.status(403).json({ error: 'Viewers cannot post status updates' });

    if (!['on-track', 'at-risk', 'off-track'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = await ProjectStatusUpdate.create({ projectId, authorId: userId, status, title, body });
    const populated = await update.populate('authorId', 'displayName email avatarColor');

    res.status(201).json({ update: populated });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:projectId/status-updates/:id
const deleteStatusUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = await ProjectStatusUpdate.findById(id);
    if (!update) return res.status(404).json({ error: 'Not found' });
    if (update.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author can delete this update' });
    }
    await update.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { getStatusUpdates, createStatusUpdate, deleteStatusUpdate };
