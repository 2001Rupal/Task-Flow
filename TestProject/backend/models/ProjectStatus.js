const mongoose = require('mongoose');

const projectStatusSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name:      { type: String, required: true, maxlength: 50 },
  color:     { type: String, required: true },
  order:     { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

projectStatusSchema.index({ projectId: 1, order: 1 });

module.exports = mongoose.model('ProjectStatus', projectStatusSchema);
