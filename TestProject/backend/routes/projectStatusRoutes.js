const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getStatuses, createStatus, updateStatus, deleteStatus, reorderStatuses
} = require('../controllers/projectStatusController');

router.use(auth);

router.get('/project/:projectId',          getStatuses);
router.post('/project/:projectId',         createStatus);
router.put('/project/:projectId/reorder',  reorderStatuses);
router.put('/:id',                         updateStatus);
router.delete('/:id',                      deleteStatus);

module.exports = router;
