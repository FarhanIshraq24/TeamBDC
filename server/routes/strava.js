const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Ride = require('../models/Ride');
const { protect, requireApproved } = require('../middleware/auth');
const { calculateTSS, computeMetrics } = require('../services/pointsEngine');
const { syncStravaActivities, refreshStravaToken } = require('../services/stravaService');

// GET /api/strava/auth - redirect to Strava OAuth
router.get('/auth', protect, requireApproved, (req, res) => {
  const scope = 'read,activity:read_all';
  const url = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.STRAVA_REDIRECT_URI)}&response_type=code&scope=${scope}&state=${req.user._id}`;
  res.json({ authUrl: url });
});

// GET /api/strava/callback - handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).json({ message: 'Missing code or state' });

  try {
    const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenRes.data;
    const user = await User.findById(state);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.stravaId = String(athlete.id);
    user.stravaAccessToken = access_token;
    user.stravaRefreshToken = refresh_token;
    user.stravaTokenExpiry = new Date(expires_at * 1000);
    user.stravaProfile = {
      username: athlete.username,
      profilePic: athlete.profile,
      city: athlete.city,
      country: athlete.country,
      measurementPreference: athlete.measurement_preference,
      ftp: athlete.ftp || user.stravaProfile?.ftp || 200
    };
    await user.save();

    // Sync activities
    await syncStravaActivities(user);

    // Redirect to frontend
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?strava=connected`);
  } catch (err) {
    console.error('Strava callback error:', err.response?.data || err.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?strava=error`);
  }
});

// POST /api/strava/sync - manually trigger sync for current user
router.post('/sync', protect, requireApproved, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.stravaId) return res.status(400).json({ message: 'Strava not connected' });
  await syncStravaActivities(user);
  const updated = await User.findById(req.user._id).select('-password -stravaAccessToken -stravaRefreshToken');
  res.json({ message: 'Strava synced successfully', user: updated });
});

// POST /api/strava/webhook - Strava push notification
router.get('/webhook', (req, res) => {
  // Strava webhook verification
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === (process.env.STRAVA_VERIFY_TOKEN || 'teambdc_webhook')) {
    res.json({ 'hub.challenge': challenge });
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
});

router.post('/webhook', async (req, res) => {
  const { object_type, object_id, aspect_type, owner_id } = req.body;
  res.status(200).send('EVENT_RECEIVED');
  if (object_type === 'activity' && (aspect_type === 'create' || aspect_type === 'update')) {
    const user = await User.findOne({ stravaId: String(owner_id) });
    if (user) await syncStravaActivities(user);
  }
});

// GET /api/strava/disconnect
router.post('/disconnect', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    stravaId: null, stravaAccessToken: null, stravaRefreshToken: null, stravaTokenExpiry: null
  });
  res.json({ message: 'Strava disconnected' });
});

module.exports = router;
