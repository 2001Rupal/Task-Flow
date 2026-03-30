const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

router.post('/register',        register);
router.post('/login',           login);
router.post('/logout',          authenticateToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
