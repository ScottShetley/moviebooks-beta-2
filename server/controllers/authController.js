// server/controllers/authController.js
const User = require('../models/User.js');
const generateToken = require('../utils/generateToken.js');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  // Destructure username, email, and password from request body
  const { username, email, password } = req.body;

  try {
    // --- MODIFICATION START: Input validation including username ---
    let errors = [];
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    if (username && (username.length < 3 || username.length > 20)) {
        errors.push('Username must be between 3 and 20 characters');
    }
     // Optional: Add regex check here if needed, though model validation catches it too
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
       errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (password && password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
     // Optional: Add basic email format check here, though model validation catches it too
     if (email && !/.+\@.+\..+/.test(email)) {
        errors.push('Please provide a valid email address');
     }

    if (errors.length > 0) {
      res.status(400); // Bad Request
      // Join multiple errors for a clearer message, or send an array
      throw new Error(errors.join(', '));
    }
    // --- MODIFICATION END: Input validation ---


    // --- MODIFICATION START: Check if email or username already exists ---
    // Use Promise.all for slightly more parallel checks
    const [emailExists, usernameExists] = await Promise.all([
         User.findOne({ email: email.toLowerCase() }), // Check lowercase email
         User.findOne({ username: username.toLowerCase() }) // Check lowercase username
    ]);

    let conflictErrors = [];
    if (emailExists) {
      conflictErrors.push('User already exists with that email');
    }
    if (usernameExists) {
      conflictErrors.push('Username is already taken');
    }

    if (conflictErrors.length > 0) {
        res.status(400); // Bad Request (or 409 Conflict)
        throw new Error(conflictErrors.join(', '));
    }
    // --- MODIFICATION END: Check uniqueness ---


    // --- MODIFICATION START: Create new user with username ---
    // Password hashing is handled by pre-save middleware in User model
    const user = await User.create({
      username: username, // Pass username here
      email: email,
      password: password,
    });
    // --- MODIFICATION END: Create new user ---


    // If user created successfully, send back user info (including username) and token
    if (user) {
      res.status(201).json({ // 201 Created
        _id: user._id,
        username: user.username, // <-- Include username in response
        email: user.email,
        token: generateToken(user._id), // Generate JWT
        createdAt: user.createdAt,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data - user creation failed'); // More specific error
    }
  } catch (error) {
    // Pass error to the centralized error handler middleware
    // If status hasn't been set yet, the default error handler will set 500
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
     // Basic input validation
     if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user by email (case-insensitive search using lowercase)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // --- MODIFICATION START: Include username in login response ---
      res.json({
        _id: user._id,
        username: user.username, // <-- Include username in response
        email: user.email,
        token: generateToken(user._id), // Generate JWT
        createdAt: user.createdAt,
      });
      // --- MODIFICATION END: Include username in login response ---
    } else {
      res.status(401); // Unauthorized
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };