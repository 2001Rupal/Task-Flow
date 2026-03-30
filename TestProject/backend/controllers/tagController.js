const Tag = require('../models/Tag');
const Collaboration = require('../models/Collaboration');

async function checkListAccess(listId, userId) {
  return Collaboration.findOne({ listId, userId });
}

const getTags = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const collab = await checkListAccess(listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });
    const tags = await Tag.find({ listId }).sort({ name: 1 });
    res.json({ tags });
  } catch (e) { next(e); }
};

const createTag = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Tag name required' });
    const collab = await checkListAccess(listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });
    const tag = await Tag.create({ listId, name: name.trim(), color: color || '#6366f1' });
    res.status(201).json({ tag });
  } catch (e) { next(e); }
};

const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const tag = await Tag.findById(id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    const collab = await checkListAccess(tag.listId, req.user.userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });
    if (name) tag.name = name.trim();
    if (color) tag.color = color;
    await tag.save();
    res.json({ tag });
  } catch (e) { next(e); }
};

const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findById(id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    const collab = await checkListAccess(tag.listId, req.user.userId);
    if (!collab || collab.role !== 'Owner') return res.status(403).json({ error: 'Only owners can delete tags' });
    await tag.deleteOne();
    // Remove tag from all todos in this list
    const Todo = require('../models/Todo');
    await Todo.updateMany({ listId: tag.listId }, { $pull: { tags: tag._id } });
    res.json({ message: 'Tag deleted' });
  } catch (e) { next(e); }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
