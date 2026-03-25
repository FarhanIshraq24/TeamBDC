const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/announcements - public
router.get('/', async (req, res) => {
  const announcements = await Announcement.find()
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(20)
    .populate('author', 'name profilePhoto');
  res.json(announcements);
});

// POST /api/announcements - admin
router.post('/', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const { title, content, isPinned, tags } = req.body;
  const ann = await Announcement.create({ title, content, isPinned, tags, author: req.user._id });
  res.status(201).json(ann);
});

// PUT /api/announcements/:id
router.put('/:id', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ann) return res.status(404).json({ message: 'Not found' });
  res.json(ann);
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
