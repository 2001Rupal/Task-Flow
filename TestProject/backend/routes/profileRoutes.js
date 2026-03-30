const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getMyWork, getWorkload } = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',          getProfile);
router.put('/',          updateProfile);
router.get('/my-work',   getMyWork);
router.get('/workload',  getWorkload);

module.exports = router;
