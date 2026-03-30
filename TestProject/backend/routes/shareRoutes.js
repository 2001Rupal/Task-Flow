const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const authenticateToken = require('../middleware/auth');

// Share todo by email (requires authentication)
router.post('/todos/:todoId/email', authenticateToken, shareController.shareTodoByEmail);

// Share list by email (requires authentication)
router.post('/lists/:listId/email', authenticateToken, shareController.shareListByEmail);

// Generate share link for todo (requires authentication)
router.post('/todos/:todoId/link', authenticateToken, shareController.generateTodoShareLink);

// Generate share link for list (requires authentication)
router.post('/lists/:listId/link', authenticateToken, shareController.generateListShareLink);

// Revoke share link (requires authentication)
router.delete('/links/:token', authenticateToken, shareController.revokeShareLink);

// Get shared content (public route - no authentication required)
router.get('/:token', shareController.getSharedContent);

module.exports = router;