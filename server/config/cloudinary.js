const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary SDK
// The configuration is done automatically when CLOUDINARY_URL environment variable is set,
// or manually using cloudinary.config() if CLOUDINARY_CLOUD_NAME, etc., are set.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Optional: Ensures HTTPS URLs are generated
});

console.log('Cloudinary Configured:', cloudinary.config().cloud_name ? 'Yes' : 'No'); // Basic check

module.exports = cloudinary; // Export the configured cloudinary instance