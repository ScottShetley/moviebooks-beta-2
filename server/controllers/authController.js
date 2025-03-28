// server/controllers/authController.js
const User = require('../models/User.js');
const generateToken = require('../utils/generateToken.js');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Basic input validation
    if (!email || !password) {
      res.status(400); // Bad Request
      throw new Error('Please provide email and password');
    }
     if (password.length < 6) {
       res.status(400);
       throw new Error('Password must be at least 6 characters');
     }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with that email');
    }

    // Create new user (password hashing is handled by pre-save middleware in User model)
    const user = await User.create({
      email,
      password,
    });

    // If user created successfully, send back user info and token
    if (user) {
      res.status(201).json({ // 201 Created
        _id: user._id,
        email: user.email,
        token: generateToken(user._id), // Generate JWT
        createdAt: user.createdAt,
      });
    } else {
      // This case might be rare if validation passes but create fails
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    // Pass error to the centralized error handler middleware
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

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    // User model has a 'matchPassword' method we created
    if (user && (await user.matchPassword(password))) {
      // Send back user info and token
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id), // Generate JWT
        createdAt: user.createdAt,
      });
    } else {
      // If user not found or password doesn't match
      res.status(401); // Unauthorized
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };