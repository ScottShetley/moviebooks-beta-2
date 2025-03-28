// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Need the User model to find the user from the token

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (remove 'Bearer ' part)
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user associated with the token's ID
      // We exclude the password field from the user object attached to the request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Handle case where user might have been deleted after token was issued
        throw new Error('User not found');
      }

      // If token is valid and user found, proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Send 401 Unauthorized if token is invalid or expired
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };