// server/scripts/setMissingIsPrivateToFalse.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js'; // Import your User model

dotenv.config(); // Load environment variables

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const dbUri = process.env.NODE_ENV === 'production'
        ? process.env.MONGO_URI // Use the production URI if in production env
        : process.env.MONGO_URI_DEV || process.env.MONGO_URI; // Use dev or main URI for dev

    // Ensure we have a connection URI
    if (!dbUri) {
        console.error('MongoDB connection URI not found in environment variables.');
        process.exit(1); // Exit with an error code
    }

    await mongoose.connect(dbUri, {
      useNewUrlParser: true, // Deprecated but often included
      useUnifiedTopology: true, // Deprecated but often included
    });
    console.log('MongoDB Connected!');

    console.log('Starting migration: Setting missing "isPrivate" fields to false...');

    // Find users where 'isPrivate' field is null or doesn't exist, and set it to false
    // Mongoose/MongoDB query { field: null } matches docs where the field is null OR missing
    const result = await User.updateMany(
      { isPrivate: { $exists: false } }, // Find documents where isPrivate does NOT exist
      { $set: { isPrivate: false } }       // Set isPrivate to false
      // Alternatively, to match null OR missing: { $or: [ { isPrivate: null }, { isPrivate: { $exists: false } } ] }
      // But { isPrivate: { $exists: false } } is usually sufficient for this case
    );

    console.log('Migration complete!');
    console.log(`Matched ${result.matchedCount} users.`);
    console.log(`Modified ${result.modifiedCount} users.`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1); // Exit with an error code on failure
  } finally {
    // Disconnect from MongoDB after migration (success or failure)
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
    // process.exit(0); // Exit successfully
  }
};

// Execute the migration function
migrate();