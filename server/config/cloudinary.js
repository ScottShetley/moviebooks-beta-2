// server/config/cloudinary.js (Converted to ES Modules)
import { v2 as cloudinary } from 'cloudinary'; // Use import and alias 'v2' to 'cloudinary'
import dotenv from 'dotenv';                 // Use import

// Load environment variables from .env file, particularly CLOUDINARY_* variables
dotenv.config();

// Configure the Cloudinary SDK with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensures that Cloudinary URLs are generated using HTTPS for security
});

// --- Debug log removed for production ---
// console.log('Cloudinary Configured:', cloudinary.config().cloud_name ? 'Yes' : 'No');

// Export the configured Cloudinary instance for use in other parts of the application
export default cloudinary;
