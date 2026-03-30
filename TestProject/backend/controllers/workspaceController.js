const { v4: uuidv4 } = require('uuid');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const List = require('../models/List');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

// ── Create workspace ──────────────────────────
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Workspace name is required' });
    if (name.length > 100) return res.status(400).json({ error: 'Name must be 100 characters or less' });

    const workspace = await Workspace.create({ name: name.trim(), description: description || '', ownerId: userId });
    await WorkspaceMember.create({ workspaceId: workspace._id, userId, role: 'Owner' });

    res.status(201).json({ workspace });
  } catch (err) { next(err); }
};

// ── Get my workspaces ─────────────────────────
const getMyWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const memberships = await WorkspaceMember.find({ userId }).populate('workspaceId');
    const workspaces = memberships.map(m => ({
      ...m.workspaceId.toObject(),
      role: m.role
    }));
    res.json({ workspaces });
  } catch (err) { next(err); }
};

// ── Get workspace by ID ───────────────────────
const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const member = await WorkspaceMember.findOne({ workspaceId: id, userId });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const members = await WorkspaceMember.find({ workspaceId: id })
      .populate('userId', 'email displayName avatarColor');

    res.json({ workspace, members, role: member.role });
  } catch (err) { next(err); }
};

// ── Update workspace ──────────────────────────
const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;

    const member = await WorkspaceMember.findOne({ workspaceId: id, userId });
    if (!member || !['Owner', 'Admin'].includes(member.role)) {
      return res.status(403).json({ error: 'Only Owner or Admin can update workspace' });
    }

    const update = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      update.name = name.trim();
    }
    if (description !== undefined) update.description = description;

    const workspace = await Workspace.findByIdAndUpdate(id, update, { new: true });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    res.json({ workspace });
  } catch (err) { next(err); }
};

// ── Delete workspace ──────────────────────────
const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    if (workspace.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the workspace owner can delete it' });
    }

    // Cascade delete
    const projects = await List.find({ workspaceId: id }).select('_id');
    const projectIds = projects.map(p => p._id);
    const tasks = await Todo.find({ listId: { $in: projectIds } }).select('_id');
    const taskIds = tasks.map(t => t._id);

    await Comment.deleteMany({ todoId: { $in: taskIds } });
    await Activity.deleteMany({ taskId: { $in: taskIds } });
    await Todo.deleteMany({ listId: { $in: projectIds } });
    await Collaboration.deleteMany({ listId: { $in: projectIds } });
    await List.deleteMany({ workspaceId: id });
    await Notification.deleteMany({ 'payload.workspaceId': id });
    await WorkspaceMember.deleteMany({ workspaceId: id });
    await WorkspaceInvite.deleteMany({ workspaceId: id });
    await Workspace.findByIdAndDelete(id);

    res.json({ message: 'Workspace deleted' });
  } catch (err) { next(err); }
};

// ── Invite member ─────────────────────────────
const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user.userId;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!['Admin', 'Member'].includes(role)) return res.status(400).json({ error: 'Role must be Admin or Member' });

    const member = await WorkspaceMember.findOne({ workspaceId: id, userId });
    if (!member || !['Owner', 'Admin'].includes(member.role)) {
      return res.status(403).json({ error: 'Only Owner or Admin can invite members' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    // Check if already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existing = await WorkspaceMember.findOne({ workspaceId: id, userId: existingUser._id });
      if (existing) {
        existing.role = role;
        await existing.save();
        return res.json({ message: 'Member role updated' });
      }
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await WorkspaceInvite.findOneAndUpdate(
      { workspaceId: id, email: email.toLowerCase() },
      { role, token, invitedBy: userId, status: 'pending', expiresAt },
      { upsert: true, new: true }
    );

    const inviteLink = `${process.env.APP_URL}/invite/workspace?token=${token}`;
    const inviter = await User.findById(userId).select('email');

    await notificationService.notifyWorkspaceInvite(email, inviter, workspace, inviteLink);
    emailService.sendWorkspaceInvitation(email, inviter.email, workspace.name, inviteLink)
      .catch(err => console.error('Invite email error:', err.message));

    res.json({ message: 'Invitation sent', inviteLink });
  } catch (err) { next(err); }
};

// ── Accept workspace invite ───────────────────
const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const invite = await WorkspaceInvite.findOne({ token });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Invite already used' });
    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return res.status(410).json({ error: 'Invite expired' });
    }

    const user = await User.findOne({ email: invite.email });
    if (!user) return res.status(400).json({ error: 'No account found for this email. Please register first.' });

    await WorkspaceMember.findOneAndUpdate(
      { workspaceId: invite.workspaceId, userId: user._id },
      { workspaceId: invite.workspaceId, userId: user._id, role: invite.role },
      { upsert: true }
    );

    invite.status = 'accepted';
    await invite.save();

    const workspace = await Workspace.findById(invite.workspaceId);
    res.json({ message: 'Joined workspace', workspace });
  } catch (err) { next(err); }
};

// ── Remove member ─────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.userId;

    const actor = await WorkspaceMember.findOne({ workspaceId: id, userId });
    if (!actor || !['Owner', 'Admin'].includes(actor.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const target = await WorkspaceMember.findOne({ workspaceId: id, userId: memberId });
    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.role === 'Owner') return res.status(400).json({ error: 'Cannot remove workspace owner' });
    if (actor.role === 'Admin' && target.role === 'Admin') {
      return res.status(403).json({ error: 'Admins cannot remove other admins' });
    }

    await WorkspaceMember.findByIdAndDelete(target._id);
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = {
  createWorkspace, getMyWorkspaces, getWorkspaceById, updateWorkspace,
  deleteWorkspace, inviteMember, acceptInvite, removeMember
};
