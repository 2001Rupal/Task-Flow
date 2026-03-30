const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const { generateJWT } = require('../services/tokenService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// Register new user
const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = new User({ email, password, displayName: displayName || '' });
    await user.save();

    // Create default personal workspace (BR-1.6, BR-1.7)
    const wsName = `${user.displayName || user.email}'s Workspace`;
    const workspace = await Workspace.create({ name: wsName, ownerId: user._id });
    await WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'Owner' });

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      workspaceId: workspace._id
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateJWT(user._id, user.email);

    // Check and send reminders in background (don't wait for it)
    try {
      const { checkAndSendReminders } = require('./reminderController');
      checkAndSendReminders(user._id).catch(console.error);
    } catch (reminderError) {
      console.error('Failed to check reminders on login:', reminderError);
      // Don't fail login if reminder check fails
    }

    res.json({
      token,
      userId: user._id,
      email: user.email,
      displayName: user.displayName || '',
      avatarColor: user.avatarColor || '#6366f1'
    });
  } catch (error) {
    next(error);
  }
};

// Logout (client-side token removal)
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// ── Forgot password — send reset email ────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, resetLink);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// ── Reset password — consume token ────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

    user.password = password; // pre-save hook will hash it
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, forgotPassword, resetPassword };
