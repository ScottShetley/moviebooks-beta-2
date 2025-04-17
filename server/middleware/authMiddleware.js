// server/middleware/authMiddleware.js (ES Modules)
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * Middleware to protect routes requiring user authentication.
 * Verifies a JWT token from the Authorization header, fetches the corresponding user,
 * and attaches the user object (excluding the password) to the request object (req.user).
 * Uses asyncHandler to automatically handle promise rejections and pass errors to the global error handler.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer scheme)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user associated with the token's ID.
      // Attach the user object to the request for use in subsequent middleware/controllers.
      // Exclude the password field from the user object attached to the request.
      req.user = await User.findById(decoded.id).select('-password');

      // Defensive check: Ensure user exists in the database.
      // This handles cases where the token is valid but the user has been deleted.
      if (!req.user) {
        res.status(401); // Unauthorized
        throw new Error('Not authorized, user associated with token not found');
      }

      // Token is valid, user is found, proceed to the next middleware or route handler.
      next();

    } catch (error) {
      // --- Debug log removed --- (Global error handler will log the stack)
      // console.error('Token verification failed:', error.message);

      res.status(401); // Unauthorized
      // Throw error to be caught by the global error handler (via asyncHandler)
      throw new Error('Not authorized, token verification failed');
    }
  }

  // If no token was found in the header
  if (!token) {
    res.status(401); // Unauthorized
    throw new Error('Not authorized, no token provided');
  }
});

// --- Use named export ---
export { protect };
