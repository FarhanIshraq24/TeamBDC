const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stravaActivityId: { type: String, unique: true, sparse: true },
  name: { type: String, default: 'Cycling Activity' },
  date: { type: Date, required: true, index: true },
  type: { type: String, default: 'Ride' },
  // Core metrics
  distance: { type: Number, default: 0 },           // km
  movingTime: { type: Number, default: 0 },          // seconds
  elapsedTime: { type: Number, default: 0 },         // seconds
  elevationGain: { type: Number, default: 0 },       // meters
  avgSpeed: { type: Number, default: 0 },            // km/h
  maxSpeed: { type: Number, default: 0 },            // km/h
  avgHeartRate: { type: Number, default: null },
  maxHeartRate: { type: Number, default: null },
  avgWatts: { type: Number, default: null },
  maxWatts: { type: Number, default: null },
  // Computed performance metrics
  normalizedPower: { type: Number, default: null },   // NP
  intensityFactor: { type: Number, default: null },   // IF = NP/FTP
  tss: { type: Number, default: 0 },                  // Training Stress Score
  // Source
  source: { type: String, enum: ['strava', 'manual', 'screenshot'], default: 'strava' },
  // Strava extras
  kudosCount: { type: Number, default: 0 },
  mapPolyline: { type: String, default: null },
}, { timestamps: true });

// Virtual: duration formatted
rideSchema.virtual('durationFormatted').get(function () {
  const h = Math.floor(this.movingTime / 3600);
  const m = Math.floor((this.movingTime % 3600) / 60);
  return `${h}h ${m}m`;
});

module.exports = mongoose.model('Ride', rideSchema);
