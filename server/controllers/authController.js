// server/controllers/authController.js (ES Modules)
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler (async (req, res) => {
  const {username, email, password} = req.body;

  // --- Input validation ---
  let errors = [];
  if (!username) errors.push ('Username is required');
  if (!email) errors.push ('Email is required');
  if (!password) errors.push ('Password is required');
  if (username && (username.length < 3 || username.length > 20))
    errors.push ('Username must be between 3 and 20 characters');
  if (username && !/^[a-zA-Z0-9_]+$/.test (username))
    errors.push ('Username can only contain letters, numbers, and underscores');
  if (password && password.length < 6)
    errors.push ('Password must be at least 6 characters');
  if (email && !/.+\@.+\..+/.test (email))
    errors.push ('Please provide a valid email address');

  if (errors.length > 0) {
    res.status (400);
    throw new Error (errors.join (', '));
  }

  // --- Check uniqueness ---
  const [emailExists, usernameExists] = await Promise.all ([
    User.findOne ({email: email.toLowerCase ()}),
    User.findOne ({username: username.toLowerCase ()}),
  ]);

  let conflictErrors = [];
  if (emailExists) conflictErrors.push ('User already exists with that email');
  if (usernameExists) conflictErrors.push ('Username is already taken');

  if (conflictErrors.length > 0) {
    res.status (400);
    throw new Error (conflictErrors.join (', '));
  }

  // --- Create user ---
  const user = await User.create ({username, email, password});

  if (user) {
    // --- MODIFIED: Added favorites array ---
    res.status (201).json ({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [], // Include favorites (default to empty array if somehow missing)
      token: generateToken (user._id),
      createdAt: user.createdAt,
    });
    // --- END MODIFICATION ---
  } else {
    res.status (400);
    throw new Error ('Invalid user data - user creation failed');
  }
}); // End asyncHandler

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler (async (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    res.status (400);
    throw new Error ('Please provide email and password');
  }

  // --- Fetch user including favorites ---
  // Ensure the User model actually HAS a favorites field
  const user = await User.findOne ({
    email: email.toLowerCase (),
  }) /*.select('+favorites')*/; // .select might be needed if favorites is excluded by default

  if (user && (await user.matchPassword (password))) {
    // --- MODIFIED: Added favorites array ---
    res.json ({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [], // Include favorites (default to empty array if somehow missing)
      token: generateToken (user._id),
      createdAt: user.createdAt,
    });
    // --- END MODIFICATION ---
  } else {
    res.status (401);
    throw new Error ('Invalid email or password');
  }
}); // End asyncHandler

// --- Use NAMED exports ---
export {registerUser, loginUser};
