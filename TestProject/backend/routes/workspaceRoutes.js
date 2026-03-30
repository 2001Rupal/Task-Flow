const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createWorkspace, getMyWorkspaces, getWorkspaceById, updateWorkspace,
  deleteWorkspace, inviteMember, acceptInvite, removeMember
} = require('../controllers/workspaceController');

router.get('/invite/accept', acceptInvite);   // public — no auth required

router.use(auth);

router.post('/',           createWorkspace);
router.get('/',            getMyWorkspaces);
router.get('/:id',         getWorkspaceById);
router.put('/:id',         updateWorkspace);
router.delete('/:id',      deleteWorkspace);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:memberId', removeMember);

// People
const { getWorkspacePeople, getMemberTasks } = require('../controllers/peopleController');
router.get('/:id/people',                  getWorkspacePeople);
router.get('/:id/people/:userId/tasks',    getMemberTasks);

// Portfolio — all projects summary for a workspace
const { getPortfolio } = require('../controllers/portfolioController');
router.get('/:id/portfolio', getPortfolio);

module.exports = router;
