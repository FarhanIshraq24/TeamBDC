const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const { protect, requireApproved } = require('../middleware/auth');

// GET /api/rides/:userId - get all rides for a user
router.get('/:userId', protect, requireApproved, async (req, res) => {
  const { limit = 20, offset = 0, month, year } = req.query;
  let query = { userId: req.params.userId };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }
  const rides = await Ride.find(query).sort({ date: -1 }).skip(Number(offset)).limit(Number(limit));
  const total = await Ride.countDocuments(query);
  res.json({ rides, total });
});

// GET /api/rides/:userId/stats - aggregated stats
router.get('/:userId/stats', protect, requireApproved, async (req, res) => {
  const userId = req.params.userId;
  const { period = 'month' } = req.query;

  const now = new Date();
  let startDate;
  if (period === 'week') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);
  else startDate = new Date(0);

  const stats = await Ride.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: startDate } } },
    { $group: {
      _id: null,
      totalDistance: { $sum: '$distance' },
      totalElevation: { $sum: '$elevationGain' },
      totalTime: { $sum: '$movingTime' },
      totalTSS: { $sum: '$tss' },
      totalRides: { $sum: 1 },
      avgSpeed: { $avg: '$avgSpeed' },
      maxDistance: { $max: '$distance' }
    }}
  ]);

  // Weekly distance chart data (last 12 weeks)
  const weeklyData = await Ride.aggregate([
    { $match: {
      userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
      date: { $gte: new Date(Date.now() - 84 * 24 * 3600 * 1000) }
    }},
    { $group: {
      _id: { $week: '$date' },
      distance: { $sum: '$distance' },
      rides: { $sum: 1 },
      tss: { $sum: '$tss' }
    }},
    { $sort: { '_id': 1 } }
  ]);

  // Monthly distance chart (last 12 months)
  const monthlyData = await Ride.aggregate([
    { $match: {
      userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
      date: { $gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) }
    }},
    { $group: {
      _id: { month: { $month: '$date' }, year: { $year: '$date' } },
      distance: { $sum: '$distance' },
      rides: { $sum: 1 },
      tss: { $sum: '$tss' },
      avgSpeed: { $avg: '$avgSpeed' }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({ stats: stats[0] || {}, weeklyData, monthlyData });
});

// POST /api/rides/manual - add a manual ride
router.post('/manual', protect, requireApproved, async (req, res) => {
  const { distance, movingTime, elevationGain, avgSpeed, date, name } = req.body;
  const ride = await Ride.create({
    userId: req.user._id,
    name: name || 'Manual Ride',
    date: date || new Date(),
    distance, movingTime, elevationGain, avgSpeed,
    source: 'manual'
  });
  res.status(201).json(ride);
});

module.exports = router;
