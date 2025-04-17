// server/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv'; // Ensure dotenv is imported if MONGO_URI relies on it

// Load environment variables (if not already loaded globally in your main server file)
// If dotenv.config() is called reliably in your server entry point before this runs,
// you might not strictly need it here, but it doesn't hurt to ensure it's loaded.
dotenv.config();

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Reads the connection string from the MONGO_URI environment variable.
 * Exits the application process if the connection fails.
 */
const connectDB = async () => {
  try {
    // Ensure the MongoDB connection string is available in environment variables.
    if (!process.env.MONGO_URI) {
      console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
      throw new Error('MONGO_URI not defined'); // Throw error to be caught below
    }

    // Attempt to connect to the MongoDB database
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log successful connection (useful for startup verification)
    console.log(`MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // Log any errors that occur during the connection attempt
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // Exit the Node.js process with a failure code (1)
    // This prevents the application from running without a database connection.
    process.exit(1);
  }
};

// Export the connectDB function to be used in the main server file
export default connectDB;
