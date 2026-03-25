const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  category: { type: String, enum: ['race', 'record', 'event', 'milestone'], default: 'event' },
  riderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  photo: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
