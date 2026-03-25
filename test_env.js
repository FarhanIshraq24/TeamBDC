require('dotenv').config();
const mongoose = require('mongoose');

console.log('--- ENV CHECK ---');
console.log('STRAVA_CLIENT_ID:', process.env.STRAVA_CLIENT_ID);
console.log('STRAVA_REDIRECT_URI:', process.env.STRAVA_REDIRECT_URI);
console.log('PORT:', process.env.PORT);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('SUCCESS: MongoDB connected.');
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR: MongoDB connection failed:', err.message);
    process.exit(1);
  });
