const mongoose = require('mongoose');

const customFieldValueSchema = new mongoose.Schema({
  taskId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true },
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomField', required: true },
  value:   { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

customFieldValueSchema.index({ taskId: 1 });
customFieldValueSchema.index({ taskId: 1, fieldId: 1 }, { unique: true });

module.exports = mongoose.model('CustomFieldValue', customFieldValueSchema);
