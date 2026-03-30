const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadAttachment, getAttachments, downloadAttachment, deleteAttachment, getAllAttachments,
  shareAttachmentsViaEmail, publicDownloadAttachment
} = require('../controllers/attachmentController');

// Public route (no auth)
router.get('/public/:token/download', publicDownloadAttachment);

router.use(auth);

router.post('/task/:taskId',    upload.single('file'), uploadAttachment);
router.post('/share-email',     shareAttachmentsViaEmail);
router.get('/all',              getAllAttachments);
router.get('/task/:taskId',     getAttachments);
router.get('/:id/download',     downloadAttachment);
router.delete('/:id',           deleteAttachment);

module.exports = router;
