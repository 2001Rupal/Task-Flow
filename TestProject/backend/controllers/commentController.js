const path = require('path');
const fs = require('fs');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const WorkspaceMember = require('../models/WorkspaceMember');
const List = require('../models/List');
const Notification = require('../models/Notification');
const User = require('../models/User');
const socketService = require('../services/socketService');
const activityService = require('../services/activityService');

async function checkAccess(todoId, userId) {
  const todo = await Todo.findById(todoId);
  if (!todo) return null;

  // Check project-level collaboration first
  const collab = await Collaboration.findOne({ listId: todo.listId, userId, status: 'active' });
  if (collab) return { todo, collab, role: collab.role };

  // Fall back to workspace-level membership (owners/admins can access all projects)
  const project = await List.findById(todo.listId).select('workspaceId');
  if (!project) return null;
  const wsMember = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId });
  if (wsMember) return { todo, collab: null, role: wsMember.role };

  return null;
}

function populateComment(query) {
  return query
    .populate('userId', 'email displayName avatarColor')
    .populate('mentions', 'email displayName avatarColor')
    .populate('attachments')
    .populate('seenBy', 'email displayName avatarColor');
}

// Parse @DisplayName mentions from text, return matched user ids
async function resolveMentions(text, listId) {
  if (!text || !text.includes('@')) return [];
  const handles = [...text.matchAll(/@([\w\s.]+?)(?=\s|$|[^a-zA-Z0-9\s.])/g)].map(m => m[1].trim());
  if (!handles.length) return [];

  const collabs = await Collaboration.find({ listId, status: 'active' })
    .populate('userId', 'displayName email');

  const mentionedIds = [];
  for (const handle of handles) {
    const match = collabs.find(c =>
      c.userId?.displayName?.toLowerCase() === handle.toLowerCase() ||
      c.userId?.email?.split('@')[0]?.toLowerCase() === handle.toLowerCase()
    );
    if (match?.userId?._id) mentionedIds.push(match.userId._id.toString());
  }
  return [...new Set(mentionedIds)];
}

// ── Get comments ──────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const access = await checkAccess(todoId, req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const comments = await populateComment(
      Comment.find({ todoId }).sort({ createdAt: 1 })
    );
    res.json({ comments });
  } catch (e) { next(e); }
};

// ── Add comment (with optional file attachments) ──
const addComment = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const { text } = req.body;

    const access = await checkAccess(todoId, req.user.userId);
    if (!access) {
      (req.files || []).forEach(f => fs.unlink(f.path, () => {}));
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!text?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Comment must have text or at least one attachment' });
    }

    // Save uploaded files as Attachment docs
    const attachmentIds = [];
    for (const file of (req.files || [])) {
      const att = await Attachment.create({
        taskId: todoId,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: req.user.userId
      });
      attachmentIds.push(att._id);
    }

    // Resolve @mentions
    const mentionedIds = await resolveMentions(text, access.todo.listId);

    const comment = await Comment.create({
      todoId,
      userId: req.user.userId,
      text: text?.trim() || '',
      attachments: attachmentIds,
      mentions: mentionedIds
    });

    const populated = await populateComment(Comment.findById(comment._id));

    // ── Notifications ─────────────────────────────
    const sender = await User.findById(req.user.userId).select('displayName email');
    const senderName = sender?.displayName || sender?.email?.split('@')[0] || 'Someone';
    const project = await List.findById(access.todo.listId).select('name');
    const taskTitle = access.todo.title || 'a task';
    const projectName = project?.name || 'a project';
    const snippet = (text || '').slice(0, 100);
    const commenterId = req.user.userId.toString();

    const notifPayload = {
      taskId: todoId,
      commentId: comment._id,
      projectId: access.todo.listId,
      projectName,
      taskTitle
    };

    // 1. @mention notifications
    for (const uid of mentionedIds) {
      if (uid === commenterId) continue;
      const notif = await Notification.create({
        userId: uid,
        type: 'mentioned',
        title: `${senderName} mentioned you in "${taskTitle}"`,
        body: snippet,
        payload: notifPayload
      });
      socketService.emitToUser(uid, 'notification:new', notif);
    }

    // 2. comment_added — notify assignee + watchers (skip commenter + already mentioned)
    const alreadyNotified = new Set([commenterId, ...mentionedIds]);
    const interestedUsers = new Set();

    if (access.todo.assignedTo) {
      interestedUsers.add(access.todo.assignedTo.toString());
    }
    for (const wId of (access.todo.watchers || [])) {
      interestedUsers.add(wId.toString());
    }

    for (const uid of interestedUsers) {
      if (alreadyNotified.has(uid)) continue;
      const notif = await Notification.create({
        userId: uid,
        type: 'comment_added',
        title: `${senderName} commented on "${taskTitle}"`,
        body: snippet || `In project: ${projectName}`,
        payload: notifPayload
      });
      socketService.emitToUser(uid, 'notification:new', notif);
    }

    // Broadcast new comment to all OTHER users in the project room
    socketService.emitToProject(access.todo.listId.toString(), 'comment:new', { comment: populated });

    res.status(201).json({ comment: populated });

    // Log activity — activityService handles socket broadcast internally
    await activityService.logActivity(todoId, req.user.userId, 'commented', null, (text || '').slice(0, 80));
  } catch (e) { next(e); }
};

// ── Update comment text ───────────────────────
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Can only edit your own comments' });

    comment.text = text.trim();
    comment.editedAt = new Date();
    await comment.save();

    const populated = await populateComment(Comment.findById(id));
    res.json({ comment: populated });
  } catch (e) { next(e); }
};

// ── Toggle emoji reaction ─────────────────────
const toggleReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'emoji required' });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const access = await checkAccess(comment.todoId.toString(), req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const userId = req.user.userId.toString();
    let bucket = comment.reactions.find(r => r.emoji === emoji);
    if (!bucket) {
      comment.reactions.push({ emoji, userIds: [userId] });
    } else {
      const idx = bucket.userIds.map(u => u.toString()).indexOf(userId);
      if (idx === -1) bucket.userIds.push(userId);
      else            bucket.userIds.splice(idx, 1);
      // prune empty buckets
      comment.reactions = comment.reactions.filter(r => r.userIds.length > 0);
    }
    await comment.save();

    // Broadcast to project room so all viewers update in real-time
    socketService.emitToProject(access.todo.listId.toString(), 'comment:reaction', {
      commentId: id,
      reactions: comment.reactions
    });

    res.json({ reactions: comment.reactions });
  } catch (e) { next(e); }
};

// ── Reply to a comment (thread) ───────────────
const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const parent = await Comment.findById(id);
    if (!parent) return res.status(404).json({ error: 'Comment not found' });

    const access = await checkAccess(parent.todoId.toString(), req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const mentionedIds = await resolveMentions(text, access.todo.listId);

    const reply = await Comment.create({
      todoId:   parent.todoId,
      userId:   req.user.userId,
      parentId: parent._id,
      text:     text.trim(),
      mentions: mentionedIds
    });

    const populated = await populateComment(Comment.findById(reply._id));

    // Broadcast new reply to project room
    socketService.emitToProject(access.todo.listId.toString(), 'comment:new', {
      comment: populated,
      parentId: id
    });

    // Notify parent comment author if different user
    const commenterId = req.user.userId.toString();
    if (parent.userId.toString() !== commenterId) {
      const sender = await User.findById(req.user.userId).select('displayName email');
      const senderName = sender?.displayName || sender?.email?.split('@')[0] || 'Someone';
      const project = await List.findById(access.todo.listId).select('name');
      const notif = await Notification.create({
        userId: parent.userId,
        type: 'comment_added',
        title: `${senderName} replied to your comment`,
        body: text.slice(0, 100),
        payload: {
          taskId: parent.todoId,
          commentId: reply._id,
          projectId: access.todo.listId,
          projectName: project?.name || '',
          taskTitle: access.todo.title || ''
        }
      });
      socketService.emitToUser(parent.userId.toString(), 'notification:new', notif);
    }

    res.status(201).json({ comment: populated });
  } catch (e) { next(e); }
};

// ── Pin / unpin a comment ─────────────────────
const pinComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const access = await checkAccess(comment.todoId.toString(), req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    comment.pinned   = !comment.pinned;
    comment.pinnedAt = comment.pinned ? new Date() : null;
    await comment.save();

    socketService.emitToProject(access.todo.listId.toString(), 'comment:pinned', {
      commentId: id,
      pinned: comment.pinned
    });

    res.json({ pinned: comment.pinned });
  } catch (e) { next(e); }
};

// ── Mark comments as seen ─────────────────────
const markSeen = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const access = await checkAccess(todoId, req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const userId = req.user.userId;
    // Add userId to seenBy on all comments they haven't seen yet
    await Comment.updateMany(
      { todoId, seenBy: { $ne: userId } },
      { $addToSet: { seenBy: userId } }
    );

    // Broadcast so others see updated read receipts
    socketService.emitToProject(access.todo.listId.toString(), 'comment:seen', {
      todoId,
      userId,
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
};

// ── Typing indicator (no DB, pure socket) ─────
const typingIndicator = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const { typing } = req.body;

    const access = await checkAccess(todoId, req.user.userId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const user = await User.findById(req.user.userId).select('displayName email avatarColor');
    socketService.emitToProject(access.todo.listId.toString(), 'comment:typing', {
      todoId,
      userId: req.user.userId,
      displayName: user?.displayName || user?.email?.split('@')[0] || 'Someone',
      avatarColor: user?.avatarColor || '#6366f1',
      typing: !!typing
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
};

// ── Delete comment ────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId.toString() !== req.user.userId)
      return res.status(403).json({ error: 'Can only delete your own comments' });

    // Delete attachment files from disk
    if (comment.attachments?.length) {
      const atts = await Attachment.find({ _id: { $in: comment.attachments } });
      for (const att of atts) {
        const filePath = path.join(__dirname, '..', 'uploads', att.filename);
        fs.unlink(filePath, () => {});
      }
      await Attachment.deleteMany({ _id: { $in: comment.attachments } });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (e) { next(e); }
};

module.exports = { getComments, addComment, updateComment, deleteComment, toggleReaction, addReply, pinComment, markSeen, typingIndicator };

