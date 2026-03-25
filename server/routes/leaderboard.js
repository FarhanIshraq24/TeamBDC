const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Points = require('../models/Points');
const Ride = require('../models/Ride');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createWorker } = require('tesseract.js');
const { calculateMonthPoints } = require('../services/pointsEngine');

// GET /api/leaderboard/monthly-top - top 3 riders this month (for landing page)
router.get('/monthly-top', async (req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const top = await Points.find({ month, year })
    .sort({ totalPoints: -1 })
    .limit(3)
    .populate('userId', 'name profilePhoto city stats totalPoints');

  res.json(top.map((p, i) => ({
    rank: i + 1,
    user: p.userId,
    points: p.totalPoints,
    distance: p.totalDistance,
    tss: p.totalTSS,
    rides: p.totalRides
  })));
});

// POST /api/leaderboard/screenshot - admin uploads Strava leaderboard screenshot for OCR parsing
router.post('/screenshot', protect, requireRole('admin', 'superadmin'), (req, res, next) => {
  req.uploadFolder = 'screenshots';
  next();
}, upload.single('screenshot'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No screenshot uploaded' });

  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Parse the OCR text - Strava leaderboard format: "Name  Distance  Time  Elevation"
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const parsedEntries = [];

    for (const line of lines) {
      // Try to find distance pattern like "123.4 km" or "12,345 m"
      const distanceMatch = line.match(/(\d+[.,]?\d*)\s*km/i);
      const elevMatch = line.match(/(\d+[.,]?\d*)\s*m/i);

      if (distanceMatch) {
        const distKm = parseFloat(distanceMatch[1].replace(',', '.'));
        // Extract name (everything before the distance)
        const namePart = line.substring(0, line.indexOf(distanceMatch[0])).trim();
        // Clean rank number from name
        const name = namePart.replace(/^\d+\s*[\.\):]?\s*/, '').trim();

        if (name && distKm > 0) {
          parsedEntries.push({
            name,
            distance: distKm,
            elevation: elevMatch ? parseFloat(elevMatch[1].replace(',', '.')) : 0,
            rawLine: line.trim()
          });
        }
      }
    }

    res.json({
      message: 'Screenshot parsed',
      parsed: parsedEntries,
      rawText: text,
      screenshotPath: `/uploads/screenshots/${req.file.filename}`
    });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ message: 'OCR processing failed', error: err.message });
  }
});

// POST /api/leaderboard/screenshot/apply - apply OCR results to rider profiles
router.post('/screenshot/apply', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  const { entries } = req.body; // [{ userId, distance, elevation }]
  if (!entries || !entries.length) return res.status(400).json({ message: 'No entries provided' });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const results = [];

  for (const entry of entries) {
    if (!entry.userId || !entry.distance) continue;

    // Create/update a manual ride record
    const existingRide = await Ride.findOne({ userId: entry.userId, source: 'screenshot', date: { $gte: new Date(year, month - 1, 1) } });
    if (existingRide) {
      // Update if new distance is higher
      if (entry.distance > existingRide.distance) {
        existingRide.distance = entry.distance;
        existingRide.elevationGain = entry.elevation || existingRide.elevationGain;
        await existingRide.save();
      }
    } else {
      await Ride.create({
        userId: entry.userId,
        name: 'Strava Leaderboard Ride',
        date: new Date(),
        distance: entry.distance,
        elevationGain: entry.elevation || 0,
        source: 'screenshot'
      });
    }

    // Recalculate points
    const pts = await calculateMonthPoints(entry.userId, month, year);
    results.push({ userId: entry.userId, points: pts?.totalPoints });
  }

  res.json({ message: 'Leaderboard updated from screenshot', results });
});

module.exports = router;
