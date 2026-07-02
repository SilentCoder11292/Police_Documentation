const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/police_drrp';

const seedUsers = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Starting database seeding...');

    // Delete existing users to ensure clean slate
    await User.deleteMany({});
    console.log('Cleared existing users.');

    const usersToCreate = [
      {
        username: 'admin',
        password: 'admin123', // Will be hashed via pre-save middleware
        role: 'Admin',
        accountStatus: 'Active',
        phoneNumber: '+917258025793'
      },
      {
        username: 'officer',
        password: 'user123', // Will be hashed via pre-save middleware
        role: 'User',
        accountStatus: 'Active',
        phoneNumber: '+917258025793'
      },
      {
        username: 'disabled_user',
        password: 'user123', // Will be hashed via pre-save middleware
        role: 'User',
        accountStatus: 'Disabled',
        phoneNumber: '+917258025793'
      }
    ];

    for (const u of usersToCreate) {
      const newUser = new User(u);
      await newUser.save();
      console.log(`Created user: ${u.username} (${u.role}) - Status: ${u.accountStatus}`);
    }

    console.log('\n=============================================================');
    console.log('Database seeded successfully!');
    console.log('Default credentials for testing:');
    console.log('1. Admin: username: "admin" | password: "admin123"');
    console.log('2. User:  username: "officer" | password: "user123"');
    console.log('3. Disabled User: username: "disabled_user" | password: "user123"');
    console.log('=============================================================\n');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

seedUsers();
