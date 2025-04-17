// server/utils/generateToken.js
import jwt from 'jsonwebtoken';

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * The token includes the user ID as payload and expires after a defined period.
 * @param {string | mongoose.Types.ObjectId} id - The user ID to include in the token payload.
 * @returns {string} The generated JWT.
 * @throws {Error} If the JWT_SECRET environment variable is not set.
 */
const generateToken = id => {
  // Critical check: Ensure the JWT secret key is available in environment variables.
  if (!process.env.JWT_SECRET) {
    // Log a fatal error message.
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
    // Exit the application process immediately. Running without a JWT secret is insecure.
    process.exit(1);
  }

  // Sign the token with the user ID payload, the secret key, and an expiration time.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Set token expiration (e.g., 30 days).
  });
};

// Export the function for use in authentication logic.
export default generateToken;
