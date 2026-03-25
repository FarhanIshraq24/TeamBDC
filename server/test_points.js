const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Ride = require('./models/Ride');
const Points = require('./models/Points');
const { recalculateMonthlyPoints } = require('./services/pointsEngine');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const john = await User.findOne({ name: 'John Doe' });
    if (!john) {
      console.log('John Doe not found. Please register him first.');
      process.exit(1);
    }

    // Create a few rides for John
    await Ride.deleteMany({ userId: john._id });
    await Ride.create([
      {
        userId: john._id,
        name: 'Morning Training',
        distance: 50.2,
        movingTime: 3600 * 2,
        elevationGain: 400,
        avgSpeed: 25.1,
        date: new Date(),
        source: 'manual'
      },
      {
        userId: john._id,
        name: 'Weekend Century',
        distance: 105.0,
        movingTime: 3600 * 4.5,
        elevationGain: 1200,
        avgSpeed: 23.3,
        date: new Date(),
        source: 'manual'
      }
    ]);

    console.log('Rides created for John Doe');

    // Also some for the admin to show competition
    const admin = await User.findOne({ email: 'admin@teambdc.com' });
    if (admin) {
        await Ride.deleteMany({ userId: admin._id });
        await Ride.create({
            userId: admin._id,
            name: 'Quick Spin',
            distance: 30,
            movingTime: 3600,
            elevationGain: 200,
            avgSpeed: 30,
            date: new Date(),
            source: 'manual'
        });
    }

    await recalculateMonthlyPoints();
    console.log('Points recalculated!');

    const points = await Points.find({ userId: john._id }).sort({ createdAt: -1 }).limit(1);
    console.log('John Doe Points:', points[0].totalPoints);

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
