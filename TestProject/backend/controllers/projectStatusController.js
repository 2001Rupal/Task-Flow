const ProjectStatus = require('../models/ProjectStatus');
const Collaboration = require('../models/Collaboration');
const Todo = require('../models/Todo');

const checkAccess = (listId, userId) => Collaboration.findOne({ listId, userId });

// ── Get statuses for a project ────────────────
const getStatuses = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const collab = await checkAccess(projectId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const statuses = await ProjectStatus.find({ projectId }).sort({ order: 1 });
    res.json({ statuses });
  } catch (err) { next(err); }
};

// ── Create custom status ──────────────────────
const createStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;

    const collab = await checkAccess(projectId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    if (!name || !name.trim()) return res.status(400).json({ error: 'Status name required' });
    if (!color) return res.status(400).json({ error: 'Color required' });

    const count = await ProjectStatus.countDocuments({ projectId });
    if (count >= 20) return res.status(400).json({ error: 'Maximum 20 statuses per project' });

    // Check uniqueness
    const exists = await ProjectStatus.findOne({ projectId, name: name.trim() });
    if (exists) return res.status(409).json({ error: 'Status name already exists' });

    const status = await ProjectStatus.create({
      projectId, name: name.trim(), color, order: count, isDefault: false
    });
    res.status(201).json({ status });
  } catch (err) { next(err); }
};

// ── Update status ─────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    const status = await ProjectStatus.findById(id);
    if (!status) return res.status(404).json({ error: 'Status not found' });

    const collab = await checkAccess(status.projectId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    if (name !== undefined) status.name = name.trim();
    if (color !== undefined) status.color = color;
    if (order !== undefined) status.order = order;
    await status.save();

    res.json({ status });
  } catch (err) { next(err); }
};

// ── Delete status ─────────────────────────────
const deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const status = await ProjectStatus.findById(id);
    if (!status) return res.status(404).json({ error: 'Status not found' });
    if (status.isDefault) return res.status(400).json({ error: 'Cannot delete default statuses' });

    const collab = await checkAccess(status.projectId, req.user.userId);
    if (!collab || collab.role !== 'Owner') return res.status(403).json({ error: 'Only project owner can delete statuses' });

    // Reassign tasks to 'To Do'
    const result = await Todo.updateMany(
      { listId: status.projectId, status: status.name },
      { $set: { status: 'To Do' } }
    );

    await ProjectStatus.findByIdAndDelete(id);
    res.json({ message: 'Status deleted', tasksUpdated: result.modifiedCount });
  } catch (err) { next(err); }
};

// ── Reorder statuses ──────────────────────────
const reorderStatuses = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { orderedIds } = req.body; // array of status IDs in new order

    const collab = await checkAccess(projectId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    const updates = orderedIds.map((statusId, idx) =>
      ProjectStatus.findByIdAndUpdate(statusId, { order: idx })
    );
    await Promise.all(updates);

    const statuses = await ProjectStatus.find({ projectId }).sort({ order: 1 });
    res.json({ statuses });
  } catch (err) { next(err); }
};

module.exports = { getStatuses, createStatus, updateStatus, deleteStatus, reorderStatuses };
