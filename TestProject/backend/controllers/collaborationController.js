const { v4: uuidv4 } = require('uuid');
const Collaboration = require('../models/Collaboration');
const List = require('../models/List');
const User = require('../models/User');
const emailService = require('../services/emailService');

// ── Invite collaborator ───────────────────────
const inviteCollaborator = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { email, role } = req.body;
    const userId = req.user.userId;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const validRoles = ['Owner', 'Editor', 'Viewer'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Role must be Owner, Editor, or Viewer' });

    const ownerCollab = await Collaboration.findOne({ listId, userId, role: 'Owner' });
    if (!ownerCollab) return res.status(403).json({ error: 'Only the project owner can invite collaborators' });

    const userToInvite = await User.findOne({ email: email.toLowerCase() });

    if (userToInvite) {
      // User exists — create/update active collaboration
      if (userToInvite._id.toString() === userId) {
        return res.status(400).json({ error: 'You cannot invite yourself' });
      }

      const existing = await Collaboration.findOne({ listId, userId: userToInvite._id });
      let collab;
      if (existing) {
        existing.role = role;
        existing.status = 'active';
        await existing.save();
        collab = existing;
      } else {
        collab = await Collaboration.create({
          listId, userId: userToInvite._id, role, invitedBy: userId, status: 'active'
        });
      }

      const list = await List.findById(listId);
      emailService.sendCollaborationInvitation(email, list?.name || '', role, req.user.email).catch(() => {});

      return res.status(201).json({ collaboration: collab });
    } else {
      // User doesn't exist — create pending invite
      const token = uuidv4();
      const existing = await Collaboration.findOne({ listId, inviteEmail: email.toLowerCase() });
      let collab;
      if (existing) {
        existing.role = role;
        existing.inviteToken = token;
        existing.status = 'pending';
        await existing.save();
        collab = existing;
      } else {
        collab = await Collaboration.create({
          listId, userId: null, role, invitedBy: userId,
          status: 'pending', inviteEmail: email.toLowerCase(), inviteToken: token
        });
      }

      const list = await List.findById(listId);
      const inviteLink = `${process.env.APP_URL}/invite/project?token=${token}`;
      emailService.sendCollaborationInvitation(email, list?.name || '', role, req.user.email).catch(() => {});

      return res.status(201).json({ collaboration: collab, inviteLink });
    }
  } catch (err) { next(err); }
};

// ── Accept project invite by token ────────────
const acceptProjectInvite = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const collab = await Collaboration.findOne({ inviteToken: token, status: 'pending' });
    if (!collab) return res.status(404).json({ error: 'Invite not found or already used' });

    const user = await User.findOne({ email: collab.inviteEmail });
    if (!user) return res.status(400).json({ error: 'No account found for this email. Please register first.' });

    collab.userId = user._id;
    collab.status = 'active';
    collab.inviteToken = null;
    await collab.save();

    const list = await List.findById(collab.listId);
    res.json({ message: 'Joined project', project: list });
  } catch (err) { next(err); }
};

// ── Get pending invites for a project ─────────
const getPendingInvites = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const collab = await Collaboration.findOne({ listId, userId: req.user.userId });
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    const pending = await Collaboration.find({ listId, status: 'pending' });
    res.json({ pending });
  } catch (err) { next(err); }
};

// ── Get all collaborators ─────────────────────
const getCollaborators = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const userCollab = await Collaboration.findOne({ listId, userId: req.user.userId });
    if (!userCollab) return res.status(403).json({ error: 'Access denied' });

    const collaborations = await Collaboration.find({ listId, status: 'active' })
      .populate('userId', 'email displayName avatarColor')
      .populate('invitedBy', 'email');

    const collaborators = collaborations.map(c => ({
      collaborationId: c._id,
      userId: c.userId?._id,
      email: c.userId?.email,
      displayName: c.userId?.displayName,
      avatarColor: c.userId?.avatarColor,
      role: c.role,
      invitedBy: c.invitedBy?.email,
      invitedAt: c.invitedAt
    }));

    res.json({ collaborators });
  } catch (err) { next(err); }
};

// ── Update collaborator role ──────────────────
const updateCollaboratorRole = async (req, res, next) => {
  try {
    const { listId, collaborationId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    const validRoles = ['Owner', 'Editor', 'Viewer'];
    if (!role || !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const ownerCollab = await Collaboration.findOne({ listId, userId, role: 'Owner' });
    if (!ownerCollab) return res.status(403).json({ error: 'Only the project owner can update roles' });

    const collab = await Collaboration.findOne({ _id: collaborationId, listId });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.role === 'Owner') return res.status(400).json({ error: "Cannot change the owner's role" });

    collab.role = role;
    await collab.save();
    res.json({ collaboration: collab });
  } catch (err) { next(err); }
};

// ── Remove collaborator ───────────────────────
const removeCollaborator = async (req, res, next) => {
  try {
    const { listId, collaborationId } = req.params;
    const userId = req.user.userId;

    const ownerCollab = await Collaboration.findOne({ listId, userId, role: 'Owner' });
    if (!ownerCollab) return res.status(403).json({ error: 'Only the project owner can remove collaborators' });

    const collab = await Collaboration.findOne({ _id: collaborationId, listId });
    if (!collab) return res.status(404).json({ error: 'Collaboration not found' });
    if (collab.role === 'Owner') return res.status(400).json({ error: 'Cannot remove the project owner' });

    await Collaboration.findByIdAndDelete(collaborationId);
    res.json({ message: 'Collaborator removed' });
  } catch (err) { next(err); }
};

module.exports = {
  inviteCollaborator, acceptProjectInvite, getPendingInvites,
  getCollaborators, updateCollaboratorRole, removeCollaborator
};
