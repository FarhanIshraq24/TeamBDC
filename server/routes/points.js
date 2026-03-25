const express = require('express');
const router = express.Router();
const Points = require('../models/Points');
const User = require('../models/User');
const { protect, requireRole, requireApproved } = require('../middleware/auth');
const { calculateMonthPoints, recalculateMonthlyPoints } = require('../services/pointsEngine');

// GET /api/points/leaderboard - ranked leaderboard (current month)
router.get('/leaderboard', async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || (now.getMonth() + 1);
  const year = parseInt(req.query.year) || now.getFullYear();

  const points = await Points.find({ month, year })
    .sort({ totalPoints: -1 })
    .populate('userId', 'name profilePhoto city stats stravaProfile');

  const ranked = points.map((p, i) => ({ ...p.toObject(), rank: i + 1 }));
  res.json({ month, year, leaderboard: ranked });
});

// GET /api/points/all-time - all-time leaderboard by total points
router.get('/all-time', async (req, res) => {
  const users = await User.find({ isApproved: true, role: 'rider' })
    .select('name profilePhoto city stats totalPoints monthlyRank')
    .sort({ totalPoints: -1 });
  res.json(users.map((u, i) => ({ ...u.toObject(), rank: i + 1 })));
});

// GET /api/points/:userId - user points history
router.get('/:userId', protect, requireApproved, async (req, res) => {
  const history = await Points.find({ userId: req.params.userId }).sort({ year: -1, month: -1 }).limit(12);
  res.json(history);
});

// POST /api/points/recalculate - admin triggers full recalculation
router.post('/recalculate', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  await recalculateMonthlyPoints();
  res.json({ message: 'Points recalculated for all riders' });
});

// POST /api/points/recalculate/:userId - recalculate for one user
router.post('/recalculate/:userId', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || (now.getMonth() + 1);
  const year = parseInt(req.query.year) || now.getFullYear();
  const result = await calculateMonthPoints(req.params.userId, month, year);
  res.json({ message: 'Points recalculated', result });
});

module.exports = router;
