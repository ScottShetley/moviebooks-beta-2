// server/controllers/userController.js (ES Modules)
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get current logged-in user's profile info
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is attached by 'protect' middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email, // Keep email for user's own view
            createdAt: req.user.createdAt,
        });
    } else {
        // Should be caught by protect middleware, but good failsafe
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all connections created by a specific user
// @route   GET /api/users/:userId/connections
// @access  Public
const getUserConnections = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400); throw new Error('Invalid User ID format');
    }
    const userExists = await User.findById(userId).select('username');
    if (!userExists) {
        res.status(404); throw new Error('User not found');
    }
    const connections = await Connection.find({ userRef: userId })
        .populate('userRef', 'username _id') // Populate username
        .populate('movieRef', 'title _id')
        .populate('bookRef', 'title _id')
        .sort({ createdAt: -1 });

    res.json({
        profileUsername: userExists.username,
        connections: connections
    });
});

// --- Use NAMED exports ---
export { getUserProfile, getUserConnections };