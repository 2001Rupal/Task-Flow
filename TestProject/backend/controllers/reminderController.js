const Todo = require('../models/Todo');
const List = require('../models/List');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Check and send reminders for a user
const checkAndSendReminders = async (userId) => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Get start of today for reminder tracking
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get user email
    const user = await User.findById(userId);
    if (!user) {
      return { sent: 0, todos: [] };
    }

    // Get all lists the user has access to
    const userCollaborations = await Collaboration.find({ userId });
    const listIds = userCollaborations.map(collab => collab.listId);

    if (listIds.length === 0) {
      return { sent: 0, todos: [] };
    }

    // Find todos that need reminders
    const todos = await Todo.find({
      listId: { $in: listIds },
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow
      },
      status: { $ne: 'Done' },
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: startOfToday } }
      ]
    }).populate('listId', 'name');

    if (todos.length === 0) {
      return { sent: 0, todos: [] };
    }

    // Send reminders and update lastReminderSent
    const sentReminders = [];
    
    for (const todo of todos) {
      try {
        // Send reminder email
        await emailService.sendReminder(
          user.email,
          todo.title,
          todo.listId.name,
          todo.dueDate
        );

        // Update lastReminderSent
        todo.lastReminderSent = now;
        await todo.save();

        sentReminders.push({
          todoId: todo._id,
          title: todo.title,
          dueDate: todo.dueDate,
          listName: todo.listId.name
        });
      } catch (emailError) {
        console.error(`Failed to send reminder for todo ${todo._id}:`, emailError);
        // Continue with other todos even if one fails
      }
    }

    return { sent: sentReminders.length, todos: sentReminders };
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
    throw error;
  }
};

// API endpoint to manually trigger reminder check
const triggerReminderCheck = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Check and send reminders
    const result = await checkAndSendReminders(userId);

    res.json({
      message: `Reminder check completed. Sent ${result.sent} reminder(s).`,
      remindersSent: result.sent,
      todos: result.todos
    });
  } catch (error) {
    next(error);
  }
};

// Get todos with upcoming due dates
const getUpcomingTodos = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all lists the user has access to
    const userCollaborations = await Collaboration.find({ userId });
    const listIds = userCollaborations.map(collab => collab.listId);

    if (listIds.length === 0) {
      return res.json({ upcomingTodos: [] });
    }

    // Find todos with due dates in next 24 hours
    const upcomingTodos = await Todo.find({
      listId: { $in: listIds },
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow
      },
      status: { $ne: 'Done' }
    })
    .populate('listId', 'name')
    .sort({ dueDate: 1 })
    .exec();

    // Format response
    const formattedTodos = upcomingTodos.map(todo => ({
      todoId: todo._id,
      title: todo.title,
      description: todo.description,
      status: todo.status,
      dueDate: todo.dueDate,
      listName: todo.listId.name,
      hoursUntilDue: Math.round((todo.dueDate - now) / (60 * 60 * 1000))
    }));

    res.json({ upcomingTodos: formattedTodos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAndSendReminders,
  triggerReminderCheck,
  getUpcomingTodos
};