// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Make sure MONGO_URI is set in your server/.env file
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in .env file');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;