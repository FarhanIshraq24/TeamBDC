require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const OrgMember = require('./models/OrgMember');
const Announcement = require('./models/Announcement');
const Achievement = require('./models/Achievement');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  console.log('Connected to DB, seeding...');

  // Clear existing
  await OrgMember.deleteMany({});
  await Announcement.deleteMany({});
  await Achievement.deleteMany({});

  // Create SuperAdmin if not exists
  const existingSuper = await User.findOne({ role: 'superadmin' });
  if (!existingSuper) {
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@teambdc.com',
      password: 'TeamBDC@2025',
      role: 'superadmin',
      isApproved: true,
      bio: 'System administrator'
    });
    console.log('✅ SuperAdmin created: superadmin@teambdc.com / TeamBDC@2025');
  }

  // Create a sample Admin
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    await User.create({
      name: 'Team Admin',
      email: 'admin@teambdc.com',
      password: 'TeamBDC@2025',
      role: 'admin',
      isApproved: true,
      bio: 'Team manager',
      city: 'Dhaka'
    });
    console.log('✅ Admin created: admin@teambdc.com / TeamBDC@2025');
  }

  // Org Members
  const orgMembers = [
    { name: 'Dr. Rahman', role: 'advisor', title: 'Chief Advisor', bio: 'Sports medicine expert with 20+ years of experience supporting athletes across Bangladesh.', order: 1 },
    { name: 'Prof. Akhtar', role: 'advisor', title: 'Technical Advisor', bio: 'Former national cycling champion, now guiding the next generation of Bangladeshi cyclists.', order: 2 },
    { name: 'Mr. Karim', role: 'advisor', title: 'Sponsorship Advisor', bio: 'Corporate relations expert helping TeamBDC grow through strategic partnerships.', order: 3 },
    { name: 'Shahidul Islam', role: 'leader', title: 'Team Leader', bio: 'Founder of TeamBDC with a vision to put Bangladesh on the global cycling map. Completed 400KM ultra-endurance in 2025.', order: 4 },
    { name: 'Rafiqul Hasan', role: 'cofounder', title: 'Co-Founder & Performance Director', bio: 'Passionate cyclist and performance coach. Responsible for structured training programs at TeamBDC.', order: 5 },
    { name: 'Mahmud Al-Amin', role: 'admin', title: 'Operations Manager', bio: 'Manages team logistics, registrations, and event coordination.', order: 6 },
  ];
  await OrgMember.insertMany(orgMembers);
  console.log('✅ Org members seeded');

  // Announcements
  await Announcement.create([
    { title: 'Welcome to TeamBDC Website!', content: 'We are thrilled to launch our official team website. Track performances, connect with teammates, and follow our journey to the top of Bangladeshi cycling!', isPinned: true, tags: ['general'] },
    { title: '400KM Ultra Ride 2025 - Completed!', content: 'TeamBDC successfully completed the 400KM ultra-endurance challenge in February 2025. A massive achievement for our team and for Bangladeshi cycling!', isPinned: false, tags: ['achievement', 'race'] },
    { title: 'Monthly Training Schedule - March 2026', content: 'Training rides every Tuesday, Thursday, and Sunday at 5:30 AM. Meeting point: Hatirjheel. Bring your hydration and be ready for structured interval training!', isPinned: false, tags: ['training'] },
  ]);
  console.log('✅ Announcements seeded');

  // Achievements
  await Achievement.create([
    { title: '400KM Ultra-Endurance Completion', description: 'TeamBDC completed a record 400KM non-stop ultra-endurance cycling challenge, setting a new mark for Bangladeshi amateur cycling.', date: new Date('2025-02-15'), category: 'record', isFeatured: true },
    { title: 'International Race Participation', description: 'TeamBDC riders represented Bangladesh in the regional amateur cycling circuit, marking the team\'s first international appearance.', date: new Date('2024-11-01'), category: 'race', isFeatured: true },
    { title: 'BDCyclists Community Milestone - 500 Members', description: 'The BDCyclists community crossed 500 active members, growing the cycling culture in Bangladesh.', date: new Date('2024-06-01'), category: 'milestone', isFeatured: false },
  ]);
  console.log('✅ Achievements seeded');

  console.log('\n🎉 Seed complete!');
  console.log('Login credentials:');
  console.log('  SuperAdmin: superadmin@teambdc.com / TeamBDC@2025');
  console.log('  Admin:      admin@teambdc.com / TeamBDC@2025');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
