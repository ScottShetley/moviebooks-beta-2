// server/controllers/userController.js
const User = require('../models/User.js');
const Connection = require('../models/Connection.js');
const mongoose = require('mongoose');

/**
 * @desc    Get current logged-in user's profile info
 * @route   GET /api/users/me
 * @access  Private (Protected by 'protect' middleware)
 */
const getUserProfile = async (req, res, next) => {
  // req.user is attached by the 'protect' middleware and now includes 'username'
  // The password was excluded by .select('-password') in the middleware
  if (req.user) {
    // --- MODIFICATION START: Return username ---
    res.json({
      _id: req.user._id,
      username: req.user.username, // <-- Include username
      email: req.user.email, // Keep email for the user's own profile view
      createdAt: req.user.createdAt,
      // Add any other fields from req.user you want to expose on the 'me' endpoint
    });
    // --- MODIFICATION END: Return username ---
  } else {
    // This case should technically be handled by 'protect' middleware first
    res.status(404);
    next(new Error('User not found or token invalid')); // More specific message
  }
};


/**
 * @desc    Get all connections created by a specific user
 * @route   GET /api/users/:userId/connections
 * @access  Public (Anyone can view user profiles/connections in BETA)
 */
const getUserConnections = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Validate User ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid User ID format');
    }

    // Optional but good: Check if the user actually exists
    // Selecting only username is sufficient for profile identification here
    const userExists = await User.findById(userId).select('username');
    if (!userExists) {
        res.status(404);
        throw new Error('User not found');
    }

    // Find connections created by this user
    const connections = await Connection.find({ userRef: userId })
      // --- MODIFICATION START: Populate username instead of email ---
      .populate('userRef', 'username _id') // <-- Select username, exclude email
      // --- MODIFICATION END: Populate username instead of email ---
      .populate('movieRef', 'title _id')
      .populate('bookRef', 'title _id')
      .sort({ createdAt: -1 });           // Sort by newest first

    // --- Optional Enhancement: Send back profile owner's username along with connections ---
    // This avoids the frontend needing to guess the username from the first connection
    // especially useful if the user has 0 connections.
    res.json({
        profileUsername: userExists.username, // Send the username directly
        connections: connections // Send the array of connections
    });
    // --- End Optional Enhancement ---

    // Previous implementation (just sending connections):
    // res.json(connections);

  } catch (error) {
    // If status hasn't been set yet, the default error handler sets 500
    next(error);
  }
};


module.exports = { getUserProfile, getUserConnections };