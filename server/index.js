require('dotenv').config({ path: '../.env' });
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const cron = require('node-cron');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/strava', require('./routes/strava'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/points', require('./routes/points'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/org', require('./routes/org'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/achievements', require('./routes/achievements'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Monthly points recalculation cron - runs on 1st of every month at 00:05
const { recalculateMonthlyPoints } = require('./services/pointsEngine');
cron.schedule('5 0 1 * *', async () => {
  console.log('Running monthly points recalculation...');
  try {
    await recalculateMonthlyPoints();
    console.log('Monthly points recalculated successfully.');
  } catch (err) {
    console.error('Cron error:', err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TeamBDC Server running on port ${PORT}`));

module.exports = app;
