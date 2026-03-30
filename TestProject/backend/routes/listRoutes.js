const express = require('express');
const router = express.Router();
const c = require('../controllers/listController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/',                  c.createList);
router.get('/',                   c.getLists);
router.get('/:id',                c.getListById);
router.put('/:id',                c.updateList);
router.delete('/:id',             c.deleteList);
router.get('/:id/stats',          c.getProjectStats);
router.get('/:id/analytics',      c.getProjectAnalytics);

// Status updates
const { getStatusUpdates, createStatusUpdate, deleteStatusUpdate } = require('../controllers/statusUpdateController');
router.get('/:projectId/status-updates',        getStatusUpdates);
router.post('/:projectId/status-updates',       createStatusUpdate);
router.delete('/:projectId/status-updates/:id', deleteStatusUpdate);

module.exports = router;
