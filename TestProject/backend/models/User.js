const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    maxlength: 50,
    default: ''
  },
  avatarColor: {
    type: String,
    default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  },
  notificationPreferences: {
    type: Object,
    default: () => ({
      taskAssigned:       { inApp: true, email: true },
      taskStatusChanged:  { inApp: true, email: false },
      commentAdded:       { inApp: true, email: true },
      mentioned:          { inApp: true, email: true },
      dueDateApproaching: { inApp: true, email: true },
      projectUpdates:     { inApp: true, email: false },
      memberChanges:      { inApp: true, email: false }
    })
  },
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
