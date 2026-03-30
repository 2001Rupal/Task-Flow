const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  name:   { type: String, required: true, maxlength: 30 },
  color:  { type: String, default: '#6366f1' }
}, { timestamps: true });

tagSchema.index({ listId: 1 });

module.exports = mongoose.model('Tag', tagSchema);
