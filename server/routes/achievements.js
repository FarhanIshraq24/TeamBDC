const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/achievements
router.get('/', async (req, res) => {
  const achievements = await Achievement.find()
    .sort({ isFeatured: -1, date: -1 })
    .populate('riderIds', 'name profilePhoto');
  res.json(achievements);
});

// POST /api/achievements - admin
router.post('/', protect, requireRole('admin', 'superadmin'), (req, res, next) => {
  req.uploadFolder = 'achievements';
  next();
}, upload.single('photo'), async (req, res) => {
  const { title, description, date, category, riderIds, isFeatured } = req.body;
  const achievement = await Achievement.create({
    title, description, date, category,
    riderIds: riderIds ? JSON.parse(riderIds) : [],
    isFeatured: isFeatured === 'true',
    photo: req.file ? `/uploads/achievements/${req.file.filename}` : ''
  });
  res.status(201).json(achievement);
});

// PUT /api/achievements/:id
router.put('/:id', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!achievement) return res.status(404).json({ message: 'Not found' });
  res.json(achievement);
});

// DELETE /api/achievements/:id
router.delete('/:id', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  await Achievement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
