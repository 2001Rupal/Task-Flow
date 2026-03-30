const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name:      { type: String, required: true, maxlength: 50 },
  type:      { type: String, enum: ['text', 'number', 'date', 'dropdown'], required: true },
  options:   [{ type: String }],   // for dropdown type
  order:     { type: Number, default: 0 }
}, { timestamps: true });

customFieldSchema.index({ projectId: 1 });

module.exports = mongoose.model('CustomField', customFieldSchema);
