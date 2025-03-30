// server/utils/generateToken.js (Corrected import)
import jwt from 'jsonwebtoken'; // <-- Change require to import

// Function to generate a JWT token for a user ID
const generateToken = id => {
  // Add check for JWT_SECRET existence for safety
  if (!process.env.JWT_SECRET) {
    console.error ('FATAL ERROR: JWT_SECRET environment variable is not set.');
    // In a real app, you might handle this more gracefully, but exiting is clear
    process.exit (1);
  }

  // Sign the token with the user ID payload, your JWT secret, and expiration time
  return jwt.sign ({id}, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token will expire in 30 days
  });
};

export default generateToken; // This line was already correctr
