const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Attachment = require('../models/Attachment');
const Todo = require('../models/Todo');
const Collaboration = require('../models/Collaboration');
const ShareLink = require('../models/ShareLink');
const activityService = require('../services/activityService');
const socketService = require('../services/socketService');
const emailService = require('../services/emailService');
const { useCloudinary } = require('../middleware/upload');

const checkAccess = async (listId, userId) => {
  const collab = await Collaboration.findOne({ listId, userId, status: 'active' });
  if (collab) return collab;
  const List = require('../models/List');
  const list = await List.findById(listId).select('ownerId');
  if (list && list.ownerId.toString() === userId.toString()) return { role: 'Owner' };
  return null;
};

// ── Upload attachment ─────────────────────────
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { taskId } = req.params;
    const userId = req.user.userId;

    const task = await Todo.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const collab = await checkAccess(task.listId, userId);
    if (!collab || collab.role === 'Viewer') return res.status(403).json({ error: 'Access denied' });

    const count = await Attachment.countDocuments({ taskId });
    if (count >= 5) {
      if (useCloudinary && req.file.filename) {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'auto' }).catch(() => {});
      } else if (req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ error: 'Maximum 5 attachments per task' });
    }

    const attachment = await Attachment.create({
      taskId,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      url:          useCloudinary ? req.file.path : null,
      uploadedBy:   userId
    });

    await activityService.logActivity(taskId, userId, 'attachment_added', null, req.file.originalname);
    socketService.emitToProject(task.listId.toString(), 'attachment:added', { taskId, attachment });

    res.status(201).json({ attachment });
  } catch (err) { next(err); }
};

// ── Get attachments for a task ────────────────
const getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Todo.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const collab = await checkAccess(task.listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const attachments = await Attachment.find({ taskId })
      .populate('uploadedBy', 'email displayName avatarColor');
    res.json({ attachments });
  } catch (err) { next(err); }
};

// ── Download / stream attachment ──────────────
const downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findById(id);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const task = await Todo.findById(attachment.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const collab = await checkAccess(task.listId, req.user.userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    if (useCloudinary && attachment.url) {
      return res.redirect(attachment.url);
    }

    const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(filePath, attachment.originalName);
  } catch (err) { next(err); }
};

// ── Delete attachment ─────────────────────────
const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const attachment = await Attachment.findById(id);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const task = await Todo.findById(attachment.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const collab = await checkAccess(task.listId, userId);
    if (!collab) return res.status(403).json({ error: 'Access denied' });

    const isUploader = attachment.uploadedBy.toString() === userId.toString();
    const isOwner = collab.role === 'Owner';
    if (!isUploader && !isOwner) return res.status(403).json({ error: 'Not authorized to delete this attachment' });

    if (useCloudinary && attachment.filename) {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(attachment.filename, { resource_type: 'auto' }).catch(() => {});
    } else {
      const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
      fs.unlink(filePath, () => {});
    }

    await activityService.logActivity(task._id, userId, 'attachment_removed', attachment.originalName, null);
    await Attachment.findByIdAndDelete(id);
    socketService.emitToProject(task.listId.toString(), 'attachment:removed', { taskId: task._id, attachmentId: id });

    res.json({ message: 'Attachment deleted' });
  } catch (err) { next(err); }
};

// ── Get all attachments for user ────────────────
const getAllAttachments = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const collabs = await Collaboration.find({ userId, status: 'active' }).select('listId');
    const List = require('../models/List');
    const ownedLists = await List.find({ ownerId: userId }).select('_id');

    const listIds = [
      ...collabs.map(c => c.listId.toString()),
      ...ownedLists.map(l => l._id.toString())
    ];
    const uniqueListIds = [...new Set(listIds)];

    const tasks = await Todo.find({ listId: { $in: uniqueListIds } }).select('_id name listId').populate('listId', 'name color icon');
    const taskMap = tasks.reduce((acc, task) => {
      acc[task._id.toString()] = {
        name: task.name,
        listName: task.listId?.name,
        listColor: task.listId?.color,
        listIcon: task.listId?.icon,
        projectId: task.listId?._id
      };
      return acc;
    }, {});

    const taskIds = Object.keys(taskMap);
    const attachments = await Attachment.find({ taskId: { $in: taskIds } })
      .populate('uploadedBy', 'email displayName avatarColor')
      .sort({ createdAt: -1 });

    const formattedAttachments = attachments.map(att => {
      const taskInfo = taskMap[att.taskId.toString()] || {};
      return {
        ...att.toObject(),
        taskName: taskInfo.name,
        projectName: taskInfo.listName,
        projectColor: taskInfo.listColor,
        projectIcon: taskInfo.listIcon,
        projectId: taskInfo.projectId
      };
    });

    res.json({ attachments: formattedAttachments });
  } catch (err) { next(err); }
};

// ── Share attachments via Email (Bulk) ────────────────
const shareAttachmentsViaEmail = async (req, res, next) => {
  try {
    const { attachmentIds, emails, message } = req.body;
    const userId = req.user.userId;

    if (!attachmentIds || !attachmentIds.length) return res.status(400).json({ error: 'No attachments selected' });
    if (!emails || !emails.length) return res.status(400).json({ error: 'No email addresses provided' });

    const sharableLinks = [];

    for (const attachId of attachmentIds) {
      const attachment = await Attachment.findById(attachId);
      if (!attachment) continue;

      const task = await Todo.findById(attachment.taskId);
      if (!task) continue;

      const collab = await checkAccess(task.listId, userId);
      if (!collab) continue; // Skip if no access

      const token = crypto.randomBytes(32).toString('hex');
      
      await ShareLink.create({
        token,
        resourceType: 'attachment',
        resourceId: attachment._id,
        createdBy: userId
      });

      const publicUrl = `${process.env.APP_URL || 'http://localhost:5173'}/api/attachments/public/${token}/download`;
      
      sharableLinks.push({
        name: attachment.originalName,
        size: attachment.size,
        publicUrl
      });
    }

    if (sharableLinks.length === 0) return res.status(403).json({ error: 'No valid files to share or access denied' });

    const formatBytes = (bytes) => {
      const k = 1024;
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
    };

    const filesHtml = sharableLinks.map(link => `
      <div style="margin-bottom: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #111827;">${link.name} <span style="font-weight:normal; color:#6b7280; font-size:12px;">(${formatBytes(link.size||0)})</span></p>
        <a href="${link.publicUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 6px 16px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: bold;">Download File</a>
      </div>
    `).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-top: 0; font-size: 18px;">Files Shared with You</h2>
        ${message ? `<p style="padding: 12px; background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; font-style: italic; border-radius: 0 4px 4px 0;">"${message.replace(/</g, '&lt;')}"</p>` : ''}
        <p style="margin-top: 16px;">You have been securely sent the following files via TaskFlow Pro:</p>
        ${filesHtml}
        <p style="margin-top: 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px;">Shared securely via TaskFlow Pro</p>
      </div>
    `;

    const toString = emails.join(', ');
    await emailService.sendHtmlEmail(toString, `TaskFlow Pro: ${req.user.displayName || 'Someone'} shared files with you`, htmlBody, `Files shared with you. Please enable HTML to view.`);

    res.json({ message: 'Files shared successfully', count: sharableLinks.length });
  } catch (err) { next(err); }
};

// ── Public Download Attachment ────────────────
const publicDownloadAttachment = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Validate token
    const shareLink = await ShareLink.findOne({ token, resourceType: 'attachment' });
    if (!shareLink) return res.status(404).send('Invalid or expired link');

    const attachment = await Attachment.findById(shareLink.resourceId);
    if (!attachment) return res.status(404).send('Attachment not found');

    if (useCloudinary && attachment.url) {
      return res.redirect(attachment.url);
    }

    const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing on server');
    res.download(filePath, attachment.originalName);
  } catch (err) { next(err); }
};

module.exports = { 
  uploadAttachment, getAttachments, downloadAttachment, deleteAttachment, getAllAttachments,
  shareAttachmentsViaEmail, publicDownloadAttachment
};
