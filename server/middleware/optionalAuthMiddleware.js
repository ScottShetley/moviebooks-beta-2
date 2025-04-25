// server/middleware/optionalAuthMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js'; // Make sure to import your User model

const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]; // Split 'Bearer TOKEN'

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from token payload and attach to request object
      // We select specific fields, *excluding* sensitive ones like password
      // isPrivate is generally not considered sensitive here, but password is.
      // It's okay to include isPrivate here as this middleware is only about auth status,
      // the controller will handle privacy *logic*.
      // .select('-password') excludes the password hash
      req.user = await User.findById(decoded.id).select('-password').lean(); // Use .lean() if you don't need Mongoose document methods later

      // console.log(`[optionalProtect] User authenticated: ${req.user._id}`); // Optional log

      next(); // Move to the next middleware/controller IF authenticated

    } catch (error) {
      // If token is invalid or expired, log the error but *do not* send 401 or throw error
      console.error('[optionalProtect] Token verification failed (but request proceeds):', error.message);
      // Continue without req.user being set
      next();
    }
  } else {
    // If no token is found, log it and continue without req.user being set
    // console.log('[optionalProtect] No token found in headers (request proceeds)'); // Optional log
    next();
  }
});

export { optionalProtect };