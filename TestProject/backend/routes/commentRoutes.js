const express = require('express');
const router = express.Router();
const {
  getComments, addComment, updateComment, deleteComment,
  toggleReaction, addReply, pinComment, markSeen, typingIndicator
} = require('../controllers/commentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/todos/:todoId',              getComments);
router.post('/todos/:todoId',             upload.array('attachments', 3), addComment);
router.post('/todos/:todoId/seen',        markSeen);
router.post('/todos/:todoId/typing',      typingIndicator);
router.put('/:id',                        updateComment);
router.delete('/:id',                     deleteComment);
router.post('/:id/reactions',             toggleReaction);
router.post('/:id/reply',                 addReply);
router.post('/:id/pin',                   pinComment);

module.exports = router;
