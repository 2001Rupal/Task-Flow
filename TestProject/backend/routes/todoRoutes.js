const express = require('express');
const router = express.Router();
const c = require('../controllers/todoController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/search',                         c.searchTodos);
router.post('/',                              c.createTodo);
router.get('/list/:listId',                   c.getTodosByList);
router.get('/:id',                            c.getTodoById);
router.put('/:id',                            c.updateTodo);
router.delete('/:id',                         c.deleteTodo);

// Subtasks
router.post('/:id/subtasks',                  c.addSubtask);
router.put('/:id/subtasks/:subtaskId',        c.updateSubtask);
router.delete('/:id/subtasks/:subtaskId',     c.deleteSubtask);

// Bulk
router.post('/bulk/update',                   c.bulkUpdate);

// Watchers
router.post('/:id/watchers',                  c.addWatcher);
router.delete('/:id/watchers/:watcherId',     c.removeWatcher);

module.exports = router;
