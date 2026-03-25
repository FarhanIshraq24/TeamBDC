const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['rider', 'admin', 'superadmin'], default: 'rider' },
  isApproved: { type: Boolean, default: false },
  profilePhoto: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  city: { type: String, default: 'Dhaka' },
  joinDate: { type: Date, default: Date.now },
  // Strava integration
  stravaId: { type: String, default: null },
  stravaAccessToken: { type: String, default: null },
  stravaRefreshToken: { type: String, default: null },
  stravaTokenExpiry: { type: Date, default: null },
  stravaProfile: {
    username: String,
    profilePic: String,
    city: String,
    country: String,
    measurementPreference: String,
    ftp: { type: Number, default: 200 }
  },
  // Aggregated stats (updated on sync)
  stats: {
    totalDistance: { type: Number, default: 0 },      // km
    totalElevation: { type: Number, default: 0 },     // meters
    totalRides: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },          // seconds
    avgSpeed: { type: Number, default: 0 },           // km/h
    longestRide: { type: Number, default: 0 },        // km
    currentMonthDistance: { type: Number, default: 0 },
  },
  // Performance metrics
  ctl: { type: Number, default: 0 },   // Chronic Training Load (Fitness)
  atl: { type: Number, default: 0 },   // Acute Training Load (Fatigue)
  tsb: { type: Number, default: 0 },   // Training Stress Balance (Form)
  // Points
  totalPoints: { type: Number, default: 0 },
  monthlyRank: { type: Number, default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.stravaAccessToken;
  delete obj.stravaRefreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
