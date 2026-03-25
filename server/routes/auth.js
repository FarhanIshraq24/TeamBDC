const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, bio, phone, city } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, bio, phone, city, role: 'rider', isApproved: false });
  res.status(201).json({ message: 'Registration successful! Wait for admin approval.', userId: user._id });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user._id);
  res.json({ token, user: user.toPublic() });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user.toPublic ? req.user.toPublic() : req.user);
});

// POST /api/auth/create-superadmin (one-time use, secured by secret)
router.post('/create-superadmin', async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (secret !== (process.env.SUPERADMIN_SECRET || 'teambdc_init_2025')) {
    return res.status(403).json({ message: 'Invalid secret' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password, role: 'superadmin', isApproved: true });
  const token = signToken(user._id);
  res.status(201).json({ token, user: user.toPublic() });
});

module.exports = router;
