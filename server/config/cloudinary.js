// server/config/cloudinary.js (Converted to ES Modules)
import { v2 as cloudinary } from 'cloudinary'; // Use import and alias 'v2' to 'cloudinary'
import dotenv from 'dotenv';                 // Use import

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensures HTTPS URLs are generated
});

console.log('Cloudinary Configured:', cloudinary.config().cloud_name ? 'Yes' : 'No');

// --- Use export default ---
export default cloudinary; // Export the configured cloudinary instance as the default export