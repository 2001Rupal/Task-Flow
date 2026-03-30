const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTaskActivity } = require('../controllers/activityController');

router.use(auth);
router.get('/task/:taskId', getTaskActivity);

module.exports = router;
