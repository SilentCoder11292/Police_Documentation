const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/police_drrp';
  
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[DATABASE] Connected to MongoDB. Database Name: ${conn.connection.name}`);
  } catch (err) {
    console.error(`[DATABASE ERROR] Database connection failed. Ensure MongoDB is running. Details: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
