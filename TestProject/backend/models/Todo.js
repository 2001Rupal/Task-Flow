const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title:     { type: String, required: true, maxlength: 200 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { timestamps: true });

const todoSchema = new mongoose.Schema({
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  },
  title: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 5000,
    default: ''
  },
  // status is a free string matching a ProjectStatus name
  status: {
    type: String,
    default: 'To Do'
  },
  dueDate:   { type: Date },
  startDate: { type: Date },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedAt:      { type: Date },
  lastReminderSent: { type: Date },

  // Subtasks
  subtasks: [subtaskSchema],

  // Tags (references to Tag documents)
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],

  // Time tracking
  estimatedHours: { type: Number, min: 0, default: null },
  loggedHours:    { type: Number, min: 0, default: 0 },

  // Recurrence
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },

  // Dependencies — tasks that must be done before this one
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],

  // Watchers
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Ordering within list
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

todoSchema.index({ listId: 1 });
todoSchema.index({ listId: 1, status: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ assignedTo: 1 });
todoSchema.index({ watchers: 1 });

todoSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Todo', todoSchema);
