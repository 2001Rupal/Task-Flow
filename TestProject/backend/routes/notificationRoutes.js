const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getNotifications, markRead, markAllRead, deleteNotification, clearAllNotifications
} = require('../controllers/notificationController');

router.use(auth);

router.get('/',              getNotifications);
router.put('/read-all',      markAllRead);
router.delete('/clear-all',  clearAllNotifications);
router.put('/:id/read',      markRead);
router.delete('/:id',        deleteNotification);

module.exports = router;
