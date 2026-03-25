const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, requireRole, requireApproved } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

// GET /api/users - public rider list (approved only)
router.get('/', async (req, res) => {
  const riders = await User.find({ isApproved: true, role: 'rider' })
    .select('-password -stravaAccessToken -stravaRefreshToken')
    .sort({ totalPoints: -1 });
  res.json(riders);
});

// GET /api/users/pending - admin: list pending riders
router.get('/pending', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const query = req.query.type === 'admin'
    ? { role: 'admin', isApproved: false }
    : { role: 'rider', isApproved: false };
  const users = await User.find(query).select('-password -stravaAccessToken -stravaRefreshToken');
  res.json(users);
});

// GET /api/users/all - superadmin: all users
router.get('/all', protect, requireRole('superadmin'), async (req, res) => {
  const users = await User.find().select('-password -stravaAccessToken -stravaRefreshToken');
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', protect, requireApproved, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -stravaAccessToken -stravaRefreshToken');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:id/approve - admin approves a rider
router.patch('/:id/approve', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can approve admins' });
  }
  user.isApproved = true;
  await user.save();
  res.json({ message: `${user.name} has been approved`, user: user.toPublic() });
});

// PATCH /api/users/:id/reject - admin rejects a rider
router.patch('/:id/reject', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: `${user.name} rejected and removed` });
});

// PATCH /api/users/:id/promote - superadmin promotes rider to admin
router.patch('/:id/promote', protect, requireRole('superadmin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = 'admin';
  user.isApproved = false; // needs superadmin approval as admin
  await user.save();
  res.json({ message: `${user.name} promoted to admin, pending superadmin approval`, user: user.toPublic() });
});

// PATCH /api/users/:id/profile - update own profile
router.patch('/:id/profile', protect, async (req, res) => {
  if (req.user._id.toString() !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { bio, phone, city, ftp } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;
  if (ftp !== undefined && user.stravaProfile) user.stravaProfile.ftp = ftp;
  await user.save();
  res.json(user.toPublic());
});

// POST /api/users/:id/photo - upload profile photo
router.post('/:id/photo', protect, (req, res, next) => {
  req.uploadFolder = 'profiles';
  next();
}, upload.single('photo'), async (req, res) => {
  if (req.user._id.toString() !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
  await user.save();
  res.json({ profilePhoto: user.profilePhoto });
});

// DELETE /api/users/:id - superadmin only
router.delete('/:id', protect, requireRole('superadmin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
