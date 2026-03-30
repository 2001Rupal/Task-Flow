const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  taskId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true },
  filename:     { type: String, required: true },       // UUID / Cloudinary public_id
  originalName: { type: String, required: true },       // original upload name
  mimetype:     { type: String, required: true },
  size:         { type: Number, required: true, max: 10485760 },
  url:          { type: String, default: null },        // Cloudinary secure URL (null for local)
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

attachmentSchema.index({ taskId: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
