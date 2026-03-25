const Ride = require('../models/Ride');
const Points = require('../models/Points');
const User = require('../models/User');

/**
 * TeamBDC Points Engine
 * 
 * Formula breakdown:
 * - Distance Points:     distance_km × 2
 * - Elevation Points:    elevation_m × 0.5
 * - Speed Points:        max(0, (avgSpeed_kmh - 20)) × 3  [only if above 20 km/h]
 * - TSS Points:          TSS × 0.8
 * - Race Bonus:         +50 per race activity
 * - Consistency Bonus:  +20 per week with 4+ rides
 * - Longest Ride Bonus: +30 if any ride > 100km
 * 
 * TSS = (duration_sec × NP × IF) / (FTP × 3600) × 100
 * IF  = NP / FTP
 * NP  ≈ avgWatts × 1.05 (estimated if no NP data)
 * 
 * ATL/CTL/TSB (Fitness/Fatigue/Form):
 * CTL_today = CTL_prev × e^(-1/42) + TSS × (1 - e^(-1/42))
 * ATL_today = ATL_prev × e^(-1/7) + TSS × (1 - e^(-1/7))
 * TSB_today = CTL_prev - ATL_prev
 */

exports.calculateTSS = (durationSec, avgWatts, ftp = 200) => {
  if (!avgWatts || !ftp || ftp === 0) return 0;
  const np = avgWatts * 1.05;
  const IF = Math.min(np / ftp, 1.5);
  const tss = (durationSec * np * IF) / (ftp * 3600) * 100;
  return Math.round(tss * 10) / 10;
};

exports.computeMetrics = (ride, ftp = 200) => {
  if (!ride.tss && ride.avgWatts && ride.movingTime) {
    ride.tss = exports.calculateTSS(ride.movingTime, ride.avgWatts, ftp);
    ride.intensityFactor = Math.min((ride.avgWatts * 1.05) / ftp, 1.5);
    ride.normalizedPower = ride.avgWatts * 1.05;
  }
  return ride;
};

exports.calculateFitnessMetrics = async (userId) => {
  const CTL_DECAY = Math.exp(-1 / 42);
  const ATL_DECAY = Math.exp(-1 / 7);
  const CTL_GAIN = 1 - CTL_DECAY;
  const ATL_GAIN = 1 - ATL_DECAY;

  const rides = await Ride.find({ userId }).sort({ date: 1 });
  if (rides.length === 0) return { ctl: 0, atl: 0, tsb: 0 };

  let ctl = 0, atl = 0;
  let prevDate = null;

  for (const ride of rides) {
    const tss = ride.tss || 0;
    if (prevDate) {
      const daysDiff = Math.floor((new Date(ride.date) - prevDate) / 86400000);
      for (let d = 0; d < daysDiff - 1; d++) {
        ctl = ctl * CTL_DECAY;
        atl = atl * ATL_DECAY;
      }
    }
    const prevCTL = ctl;
    ctl = ctl * CTL_DECAY + tss * CTL_GAIN;
    atl = atl * ATL_DECAY + tss * ATL_GAIN;
    prevDate = new Date(ride.date);
  }

  return {
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round((ctl - atl) * 10) / 10
  };
};

exports.calculateMonthPoints = async (userId, month, year) => {
  const user = await User.findById(userId);
  const ftp = user?.stravaProfile?.ftp || 200;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const rides = await Ride.find({ userId, date: { $gte: start, $lte: end } });

  if (rides.length === 0) return null;

  let totalDistance = 0, totalElevation = 0, totalTSS = 0, totalTime = 0;
  let raceCount = 0, speedSum = 0;
  let longestRide = 0;

  // Group rides by week for consistency check
  const ridesByWeek = {};

  for (const ride of rides) {
    totalDistance += ride.distance || 0;
    totalElevation += ride.elevationGain || 0;
    totalTime += ride.movingTime || 0;
    speedSum += ride.avgSpeed || 0;
    longestRide = Math.max(longestRide, ride.distance || 0);
    if (ride.type === 'Race') raceCount++;

    // Compute TSS if missing
    if (!ride.tss && ride.avgWatts) {
      ride.tss = exports.calculateTSS(ride.movingTime, ride.avgWatts, ftp);
    }
    totalTSS += ride.tss || 0;

    // Weekly consistency
    const weekNum = getWeekNumber(new Date(ride.date));
    ridesByWeek[weekNum] = (ridesByWeek[weekNum] || 0) + 1;
  }

  const avgSpeed = rides.length > 0 ? speedSum / rides.length : 0;
  const consistentWeeks = Object.values(ridesByWeek).filter(count => count >= 4).length;

  // Point calculations
  const distancePoints = Math.round(totalDistance * 2);
  const elevationPoints = Math.round(totalElevation * 0.5);
  const speedPoints = Math.round(Math.max(0, (avgSpeed - 20)) * 3 * rides.length * 0.1);
  const tssPoints = Math.round(totalTSS * 0.8);
  const raceBonus = raceCount * 50;
  const consistencyBonus = consistentWeeks * 20;
  const longestRideBonus = longestRide >= 100 ? 30 : longestRide >= 50 ? 15 : 0;

  const totalPoints = distancePoints + elevationPoints + speedPoints + tssPoints + raceBonus + consistencyBonus + longestRideBonus;

  const pointsData = {
    userId,
    month,
    year,
    distancePoints,
    elevationPoints,
    speedPoints,
    tssPoints,
    raceBonus,
    consistencyBonus,
    longestRideBonus,
    totalDistance,
    totalElevation,
    totalTSS,
    totalRides: rides.length,
    avgSpeedForMonth: Math.round(avgSpeed * 10) / 10,
    totalPoints
  };

  await Points.findOneAndUpdate({ userId, month, year }, pointsData, { upsert: true, new: true });
  return pointsData;
};

exports.recalculateMonthlyPoints = async () => {
  const users = await User.find({ isApproved: true });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  for (const user of users) {
    await exports.calculateMonthPoints(user._id, month, year);
  }

  // Rank users by monthly points
  const monthlyPoints = await Points.find({ month, year }).sort({ totalPoints: -1 });
  for (let i = 0; i < monthlyPoints.length; i++) {
    await Points.findByIdAndUpdate(monthlyPoints[i]._id, { rank: i + 1 });
    await User.findByIdAndUpdate(monthlyPoints[i].userId, { monthlyRank: i + 1 });
  }

  // Update total points on user
  const allUsers = await User.find({ isApproved: true });
  for (const user of allUsers) {
    const allPoints = await Points.find({ userId: user._id });
    const total = allPoints.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
    await User.findByIdAndUpdate(user._id, { totalPoints: total });
    // Also compute fitness metrics
    const metrics = await exports.calculateFitnessMetrics(user._id);
    await User.findByIdAndUpdate(user._id, metrics);
  }
};

function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}
