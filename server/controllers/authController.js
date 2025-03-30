// server/controllers/authController.js (ES Modules)
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler'; // Assuming you might use this later

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => { // Wrap with asyncHandler
    const { username, email, password } = req.body;

    // --- Input validation ---
    let errors = [];
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (username && (username.length < 3 || username.length > 20)) errors.push('Username must be between 3 and 20 characters');
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) errors.push('Username can only contain letters, numbers, and underscores');
    if (password && password.length < 6) errors.push('Password must be at least 6 characters');
    if (email && !/.+\@.+\..+/.test(email)) errors.push('Please provide a valid email address');

    if (errors.length > 0) {
        res.status(400);
        throw new Error(errors.join(', '));
    }

    // --- Check uniqueness ---
    const [emailExists, usernameExists] = await Promise.all([
        User.findOne({ email: email.toLowerCase() }),
        User.findOne({ username: username.toLowerCase() })
    ]);

    let conflictErrors = [];
    if (emailExists) conflictErrors.push('User already exists with that email');
    if (usernameExists) conflictErrors.push('Username is already taken');

    if (conflictErrors.length > 0) {
        res.status(400);
        throw new Error(conflictErrors.join(', '));
    }

    // --- Create user ---
    const user = await User.create({ username, email, password });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            createdAt: user.createdAt,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data - user creation failed');
    }
}); // End asyncHandler

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => { // Wrap with asyncHandler
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            createdAt: user.createdAt,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
}); // End asyncHandler

// --- Use NAMED exports ---
export { registerUser, loginUser };