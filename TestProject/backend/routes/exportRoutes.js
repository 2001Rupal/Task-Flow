const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authenticateToken = require('../middleware/auth');

// All export routes require authentication
router.use(authenticateToken);

// Export todo to PDF
router.get('/todos/:todoId/pdf', exportController.exportTodoToPDF);

// Export todo to Excel
router.get('/todos/:todoId/excel', exportController.exportTodoToExcel);

// Export list to PDF
router.get('/lists/:listId/pdf', exportController.exportListToPDF);

// Export list to Excel
router.get('/lists/:listId/excel', exportController.exportListToExcel);

module.exports = router;