const mongoose = require('mongoose');

const taskTemplateSchema = new mongoose.Schema({
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name:       { type: String, required: true, maxlength: 100 },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskData:   { type: mongoose.Schema.Types.Mixed, required: true }
  // taskData shape: { title, description, priority, subtasks, tags, estimatedHours }
}, { timestamps: true });

taskTemplateSchema.index({ projectId: 1 });

module.exports = mongoose.model('TaskTemplate', taskTemplateSchema);
