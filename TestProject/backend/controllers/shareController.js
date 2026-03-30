const ShareLink = require('../models/ShareLink');
const Todo = require('../models/Todo');
const List = require('../models/List');
const Collaboration = require('../models/Collaboration');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

// Share todo by email
const shareTodoByEmail = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const { recipientEmail, format, includeCollaborators } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    if (!format || !['pdf', 'excel'].includes(format)) {
      return res.status(400).json({ error: 'Format must be either "pdf" or "excel"' });
    }

    // Find the todo
    const todo = await Todo.findById(todoId);

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Check if user has access to the todo's list
    const collaboration = await Collaboration.findOne({
      listId: todo.listId,
      userId
    });

    if (!collaboration) {
      return res.status(403).json({ error: 'You do not have access to this todo' });
    }

    // Get collaborators if requested
    let collaborators = [];
    if (includeCollaborators) {
      const collabList = await Collaboration.find({ listId: todo.listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate file
    let fileBuffer, fileName, fileType;
    
    if (format === 'pdf') {
      fileBuffer = await fileService.generateTodoPDF(todo);
      fileName = `todo-${todoId}.pdf`;
      fileType = 'application/pdf';
    } else {
      fileBuffer = await fileService.generateTodoExcel(todo);
      fileName = `todo-${todoId}.xlsx`;
      fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Send email
    await emailService.sendSharedContent(
      recipientEmail,
      todo.title,
      format,
      fileBuffer,
      fileName,
      fileType
    );

    res.json({ message: 'Todo shared successfully via email' });
  } catch (error) {
    next(error);
  }
};

// Share list by email
const shareListByEmail = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { recipientEmail, format, includeCollaborators } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    if (!format || !['pdf', 'excel'].includes(format)) {
      return res.status(400).json({ error: 'Format must be either "pdf" or "excel"' });
    }

    // Check if user has access to this list
    const collaboration = await Collaboration.findOne({
      listId,
      userId
    });

    if (!collaboration) {
      return res.status(403).json({ error: 'You do not have access to this list' });
    }

    // Get list and todos
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const todos = await Todo.find({ listId }).sort({ createdAt: -1 }).exec();

    // Get collaborators if requested
    let collaborators = [];
    if (includeCollaborators) {
      const collabList = await Collaboration.find({ listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate file
    let fileBuffer, fileName, fileType;
    
    if (format === 'pdf') {
      fileBuffer = await fileService.generateListPDF(list, todos, collaborators);
      fileName = `list-${listId}.pdf`;
      fileType = 'application/pdf';
    } else {
      fileBuffer = await fileService.generateListExcel(list, todos, collaborators);
      fileName = `list-${listId}.xlsx`;
      fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Send email
    await emailService.sendSharedContent(
      recipientEmail,
      list.name,
      format,
      fileBuffer,
      fileName,
      fileType
    );

    res.json({ message: 'List shared successfully via email' });
  } catch (error) {
    next(error);
  }
};

// Generate share link for a todo
const generateTodoShareLink = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.userId;

    // Find the todo
    const todo = await Todo.findById(todoId);

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Check if user has access to the todo's list
    const collaboration = await Collaboration.findOne({
      listId: todo.listId,
      userId
    });

    if (!collaboration) {
      return res.status(403).json({ error: 'You do not have access to this todo' });
    }

    // Check if share link already exists for this todo
    const existingLink = await ShareLink.findOne({
      resourceType: 'todo',
      resourceId: todoId,
      createdBy: userId
    });

    // Delete existing link if found
    if (existingLink) {
      await ShareLink.findByIdAndDelete(existingLink._id);
    }

    // Generate new token
    const token = uuidv4();

    // Create share link
    const shareLink = new ShareLink({
      token,
      resourceType: 'todo',
      resourceId: todoId,
      createdBy: userId
    });

    await shareLink.save();

    // Generate share URL
    const shareUrl = `${process.env.APP_URL || "http://localhost:3000"}/share/${token}`;

    res.json({
      shareLink: shareUrl,
      token,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// Generate share link for a list
const generateListShareLink = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const userId = req.user.userId;

    // Check if user has access to this list
    const collaboration = await Collaboration.findOne({
      listId,
      userId
    });

    if (!collaboration) {
      return res.status(403).json({ error: 'You do not have access to this list' });
    }

    // Check if share link already exists for this list
    const existingLink = await ShareLink.findOne({
      resourceType: 'list',
      resourceId: listId,
      createdBy: userId
    });

    // Delete existing link if found
    if (existingLink) {
      await ShareLink.findByIdAndDelete(existingLink._id);
    }

    // Generate new token
    const token = uuidv4();

    // Create share link
    const shareLink = new ShareLink({
      token,
      resourceType: 'list',
      resourceId: listId,
      createdBy: userId
    });

    await shareLink.save();

    // Generate share URL
    const shareUrl = `${process.env.APP_URL || "http://localhost:3000"}/share/${token}`;

    res.json({
      shareLink: shareUrl,
      token,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// Get shared content (public route - no authentication required)
const getSharedContent = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find share link
    const shareLink = await ShareLink.findOne({ token });

    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    // Check if link is expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      await ShareLink.findByIdAndDelete(shareLink._id);
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Fetch resource based on type
    if (shareLink.resourceType === 'todo') {
      const todo = await Todo.findById(shareLink.resourceId);
      
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      res.json({
        resourceType: 'todo',
        data: {
          todoId: todo._id,
          title: todo.title,
          description: todo.description,
          status: todo.status,
          dueDate: todo.dueDate,
          completedAt: todo.completedAt,
          createdAt: todo.createdAt
        }
      });
    } else {
      // resourceType === 'list'
      const list = await List.findById(shareLink.resourceId);
      
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }

      const todos = await Todo.find({ listId: shareLink.resourceId })
        .sort({ createdAt: -1 })
        .exec();

      res.json({
        resourceType: 'list',
        data: {
          listId: list._id,
          name: list.name,
          todos: todos.map(todo => ({
            todoId: todo._id,
            title: todo.title,
            description: todo.description,
            status: todo.status,
            dueDate: todo.dueDate,
            completedAt: todo.completedAt,
            createdAt: todo.createdAt
          }))
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Revoke share link
const revokeShareLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId;

    // Find share link
    const shareLink = await ShareLink.findOne({ token });

    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Check if user is the creator
    if (shareLink.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only the creator can revoke this share link' });
    }

    // Delete the share link
    await ShareLink.findByIdAndDelete(shareLink._id);

    res.json({ message: 'Share link revoked successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareTodoByEmail,
  shareListByEmail,
  generateTodoShareLink,
  generateListShareLink,
  getSharedContent,
  revokeShareLink
};
