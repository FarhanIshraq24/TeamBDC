const axios = require('axios');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { calculateTSS } = require('./pointsEngine');

const refreshStravaToken = async (user) => {
  if (!user.stravaRefreshToken) return null;
  const now = new Date();
  if (user.stravaTokenExpiry && user.stravaTokenExpiry > now) return user.stravaAccessToken;

  try {
    const res = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.stravaRefreshToken
    });
    user.stravaAccessToken = res.data.access_token;
    user.stravaRefreshToken = res.data.refresh_token;
    user.stravaTokenExpiry = new Date(res.data.expires_at * 1000);
    await user.save();
    return user.stravaAccessToken;
  } catch (err) {
    console.error('Token refresh error:', err.response?.data || err.message);
    return null;
  }
};

const syncStravaActivities = async (user) => {
  const token = await refreshStravaToken(user);
  if (!token) throw new Error('Could not refresh Strava token');

  const ftp = user.stravaProfile?.ftp || 200;

  // Fetch all activities (paginated)
  let page = 1, allActivities = [];
  while (true) {
    const res = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page }
    });
    if (!res.data.length) break;
    allActivities = allActivities.concat(res.data);
    if (res.data.length < 100) break;
    page++;
  }

  // Filter cycling activities
  const cyclingTypes = ['Ride', 'VirtualRide', 'EBikeRide', 'Race'];
  const rides = allActivities.filter(a => cyclingTypes.includes(a.type));

  let totalDistance = 0, totalElevation = 0, totalTime = 0, totalRides = 0;
  let longestRide = 0, speedSum = 0;

  for (const activity of rides) {
    const distanceKm = (activity.distance || 0) / 1000;
    const avgSpeedKmh = ((activity.average_speed || 0) * 3.6);
    const maxSpeedKmh = ((activity.max_speed || 0) * 3.6);
    const avgWatts = activity.average_watts || null;
    const np = activity.weighted_average_watts || null;
    const tss = np ? calculateTSS(activity.moving_time, np, ftp) : 0;
    const IF = np ? Math.min(np / ftp, 1.5) : null;

    const rideData = {
      userId: user._id,
      stravaActivityId: String(activity.id),
      name: activity.name,
      date: new Date(activity.start_date),
      type: activity.type,
      distance: Math.round(distanceKm * 100) / 100,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      elevationGain: activity.total_elevation_gain || 0,
      avgSpeed: Math.round(avgSpeedKmh * 10) / 10,
      maxSpeed: Math.round(maxSpeedKmh * 10) / 10,
      avgHeartRate: activity.average_heartrate || null,
      maxHeartRate: activity.max_heartrate || null,
      avgWatts,
      maxWatts: activity.max_watts || null,
      normalizedPower: np,
      intensityFactor: IF,
      tss,
      kudosCount: activity.kudos_count || 0,
      mapPolyline: activity.map?.summary_polyline || null,
      source: 'strava'
    };

    await Ride.findOneAndUpdate(
      { stravaActivityId: String(activity.id) },
      rideData,
      { upsert: true, new: true }
    );

    totalDistance += distanceKm;
    totalElevation += activity.total_elevation_gain || 0;
    totalTime += activity.moving_time || 0;
    longestRide = Math.max(longestRide, distanceKm);
    speedSum += avgSpeedKmh;
    totalRides++;
  }

  // Update user aggregated stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRides = rides.filter(a => new Date(a.start_date) >= monthStart);
  const currentMonthDistance = monthRides.reduce((sum, a) => sum + a.distance / 1000, 0);

  await User.findByIdAndUpdate(user._id, {
    'stats.totalDistance': Math.round(totalDistance * 10) / 10,
    'stats.totalElevation': Math.round(totalElevation),
    'stats.totalRides': totalRides,
    'stats.totalTime': totalTime,
    'stats.avgSpeed': totalRides > 0 ? Math.round((speedSum / totalRides) * 10) / 10 : 0,
    'stats.longestRide': Math.round(longestRide * 10) / 10,
    'stats.currentMonthDistance': Math.round(currentMonthDistance * 10) / 10,
  });
};

module.exports = { syncStravaActivities, refreshStravaToken };
