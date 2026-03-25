const mongoose = require('mongoose');

const pointsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },   // 1-12
  year: { type: Number, required: true },
  // Point components
  distancePoints: { type: Number, default: 0 },      // distance_km * 2
  elevationPoints: { type: Number, default: 0 },     // elevation_m * 0.5
  speedPoints: { type: Number, default: 0 },          // (avgSpeed - 20) * 3
  tssPoints: { type: Number, default: 0 },            // TSS * 0.8
  raceBonus: { type: Number, default: 0 },            // +50 per race
  consistencyBonus: { type: Number, default: 0 },    // +20 if 4+ rides/week avg
  longestRideBonus: { type: Number, default: 0 },    // +30 if longest ride > 100km
  // Raw stats for this period
  totalDistance: { type: Number, default: 0 },
  totalElevation: { type: Number, default: 0 },
  totalTSS: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
  avgSpeedForMonth: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  rank: { type: Number, default: null },
}, { timestamps: true });

pointsSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Points', pointsSchema);
