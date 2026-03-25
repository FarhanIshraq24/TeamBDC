const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
