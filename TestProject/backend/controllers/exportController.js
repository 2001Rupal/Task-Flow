const Todo = require('../models/Todo');
const List = require('../models/List');
const Collaboration = require('../models/Collaboration');
const fileService = require('../services/fileService');

// Export todo to PDF
const exportTodoToPDF = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const { includeCollaborators } = req.query;
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

    // Get collaborators if requested
    let collaborators = [];
    if (includeCollaborators === 'true') {
      const collabList = await Collaboration.find({ listId: todo.listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate PDF
    const pdfBuffer = await fileService.generateTodoPDF(todo);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="todo-${todoId}.pdf"`);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Export todo to Excel
const exportTodoToExcel = async (req, res, next) => {
  try {
    const { todoId } = req.params;
    const { includeCollaborators } = req.query;
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

    // Get collaborators if requested
    let collaborators = [];
    if (includeCollaborators === 'true') {
      const collabList = await Collaboration.find({ listId: todo.listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate Excel
    const excelBuffer = await fileService.generateTodoExcel(todo);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="todo-${todoId}.xlsx"`);
    
    // Send Excel
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Export list to PDF
const exportListToPDF = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { includeCollaborators } = req.query;
    const userId = req.user.userId;

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
    if (includeCollaborators === 'true') {
      const collabList = await Collaboration.find({ listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate PDF
    const pdfBuffer = await fileService.generateListPDF(list, todos, collaborators);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="list-${listId}.pdf"`);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Export list to Excel
const exportListToExcel = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { includeCollaborators } = req.query;
    const userId = req.user.userId;

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
    if (includeCollaborators === 'true') {
      const collabList = await Collaboration.find({ listId })
        .populate('userId', 'email')
        .exec();
      
      collaborators = collabList.map(collab => ({
        email: collab.userId.email,
        role: collab.role
      }));
    }

    // Generate Excel
    const excelBuffer = await fileService.generateListExcel(list, todos, collaborators);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="list-${listId}.xlsx"`);
    
    // Send Excel
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportTodoToPDF,
  exportTodoToExcel,
  exportListToPDF,
  exportListToExcel
};