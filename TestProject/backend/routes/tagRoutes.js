const express = require('express');
const router = express.Router();
const { getTags, createTag, updateTag, deleteTag } = require('../controllers/tagController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/lists/:listId',  getTags);
router.post('/lists/:listId', createTag);
router.put('/:id',            updateTag);
router.delete('/:id',         deleteTag);

module.exports = router;
