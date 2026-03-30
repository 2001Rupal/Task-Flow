const express = require('express');
const router = express.Router();
const c = require('../controllers/collaborationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/lists/:listId/collaborators',                          c.inviteCollaborator);
router.get('/lists/:listId/collaborators',                           c.getCollaborators);
router.get('/lists/:listId/collaborators/pending',                   c.getPendingInvites);
router.put('/lists/:listId/collaborators/:collaborationId',          c.updateCollaboratorRole);
router.delete('/lists/:listId/collaborators/:collaborationId',       c.removeCollaborator);
router.get('/invite/accept',                                         c.acceptProjectInvite);

module.exports = router;