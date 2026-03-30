const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authenticateToken = require('../middleware/auth');

// All reminder routes require authentication
router.use(authenticateToken);

// Trigger reminder check manually
router.get('/check', reminderController.triggerReminderCheck);

// Get upcoming todos (due in next 24 hours)
router.get('/upcoming', reminderController.getUpcomingTodos);

module.exports = router;