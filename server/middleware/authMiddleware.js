// server/middleware/authMiddleware.js (Corrected for ES Modules)
import jwt from 'jsonwebtoken'; // Use import
import asyncHandler from 'express-async-handler'; // Import asyncHandler if needed, or remove if protect isn't async wrapped (it is implicitly via asyncHandler usage in routes)
import User from '../models/User.js'; // Use import (ensure User.js uses export default)

// Middleware to protect routes that require authentication
// Wrap with asyncHandler for proper async error handling within the middleware itself
const protect = asyncHandler (async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith ('Bearer')
  ) {
    try {
      token = req.headers.authorization.split (' ')[1];
      const decoded = jwt.verify (token, process.env.JWT_SECRET);

      // Fetch user and attach to request
      req.user = await User.findById (decoded.id).select ('-password');

      if (!req.user) {
        // Although findById might return null, explicitly handle this
        res.status (401); // Use 401 Unauthorized
        throw new Error ('Not authorized, user not found for token');
      }

      next (); // Proceed if user found
    } catch (error) {
      console.error ('Token verification failed:', error.message);
      res.status (401); // Use 401 Unauthorized
      // Throw error to be caught by express error handler via asyncHandler
      throw new Error ('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status (401); // Use 401 Unauthorized
    throw new Error ('Not authorized, no token');
  }
});

// --- Use named export ---
export {protect};
