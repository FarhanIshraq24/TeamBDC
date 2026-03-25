const express = require('express');
const router = express.Router();
const OrgMember = require('../models/OrgMember');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/org - public org member list
router.get('/', async (req, res) => {
  const members = await OrgMember.find({ isActive: true }).sort({ order: 1 });
  res.json(members);
});

// POST /api/org - superadmin adds org member
router.post('/', protect, requireRole('superadmin'), (req, res, next) => {
  req.uploadFolder = 'org';
  next();
}, upload.single('photo'), async (req, res) => {
  const { name, role, title, bio, email, phone, order } = req.body;
  const member = await OrgMember.create({
    name, role, title, bio, email, phone,
    order: order || 0,
    photo: req.file ? `/uploads/org/${req.file.filename}` : ''
  });
  res.status(201).json(member);
});

// PUT /api/org/:id
router.put('/:id', protect, requireRole('superadmin'), (req, res, next) => {
  req.uploadFolder = 'org';
  next();
}, upload.single('photo'), async (req, res) => {
  const { name, role, title, bio, email, phone, order, isActive, facebook, strava } = req.body;
  const updates = { name, role, title, bio, email, phone, order, isActive };
  if (req.file) updates.photo = `/uploads/org/${req.file.filename}`;
  if (facebook !== undefined || strava !== undefined) {
    updates.socialLinks = { facebook: facebook || '', strava: strava || '' };
  }
  const member = await OrgMember.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!member) return res.status(404).json({ message: 'Org member not found' });
  res.json(member);
});

// DELETE /api/org/:id
router.delete('/:id', protect, requireRole('superadmin'), async (req, res) => {
  await OrgMember.findByIdAndDelete(req.params.id);
  res.json({ message: 'Org member removed' });
});

module.exports = router;
