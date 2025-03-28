// server/controllers/userController.js
const User = require('../models/User.js');
const Connection = require('../models/Connection.js');
const mongoose = require('mongoose');

/**
 * @desc    Get current logged-in user's profile info
 * @route   GET /api/users/me
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  // req.user is attached by the 'protect' middleware
  // For BETA, we just return the basic info available on req.user
  if (req.user) {
    res.json({
      _id: req.user._id,
      email: req.user.email,
      createdAt: req.user.createdAt,
    });
  } else {
    // This case should technically be handled by 'protect' middleware first
    res.status(404);
    next(new Error('User not found'));
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
    const userExists = await User.findById(userId);
    if (!userExists) {
        res.status(404);
        throw new Error('User not found');
    }

    // Find connections created by this user
    const connections = await Connection.find({ userRef: userId })
      .populate('userRef', 'email _id')   // Still populate user for consistency, though it's the queried user
      .populate('movieRef', 'title _id')
      .populate('bookRef', 'title _id')
      .sort({ createdAt: -1 });           // Sort by newest first

    res.json(connections);
  } catch (error) {
    next(error);
  }
};


module.exports = { getUserProfile, getUserConnections };