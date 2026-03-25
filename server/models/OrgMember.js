const mongoose = require('mongoose');

const orgMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['advisor', 'leader', 'admin', 'cofounder'], required: true },
  title: { type: String, default: '' },   // e.g. "Chief Advisor", "Team Leader"
  bio: { type: String, default: '' },
  photo: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  socialLinks: {
    facebook: { type: String, default: '' },
    strava: { type: String, default: '' },
  },
  order: { type: Number, default: 0 },    // for display sorting
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('OrgMember', orgMemberSchema);
