// server/controllers/authController.js (ES Modules)
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // --- Input validation ---
  // Collect all validation errors before throwing.
  let errors = [];
  if (!username) errors.push('Username is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  // Specific format/length checks
  if (username && (username.length < 3 || username.length > 20))
    errors.push('Username must be between 3 and 20 characters');
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) // Basic username format check
    errors.push('Username can only contain letters, numbers, and underscores');
  if (password && password.length < 6)
    errors.push('Password must be at least 6 characters');
  if (email && !/.+\@.+\..+/.test(email)) // Basic email format check
    errors.push('Please provide a valid email address');

  // If any validation errors occurred, throw them.
  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(', ')); // Combine errors into a single message
  }

  // --- Check uniqueness (case-insensitive) ---
  // Use Promise.all to perform database lookups concurrently for efficiency.
  // Convert email and username to lowercase to ensure case-insensitive uniqueness checks.
  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ email: email.toLowerCase() }),
    User.findOne({ username: username.toLowerCase() }),
  ]);

  // Collect conflict errors separately.
  let conflictErrors = [];
  if (emailExists) conflictErrors.push('User already exists with that email');
  if (usernameExists) conflictErrors.push('Username is already taken');

  // If conflicts exist, throw them.
  if (conflictErrors.length > 0) {
    res.status(400); // Use 409 Conflict? 400 is also common here.
    throw new Error(conflictErrors.join(', '));
  }

  // --- Create user ---
  // The password will be hashed by the pre-save hook in the User model.
  const user = await User.create({ username, email, password });

  if (user) {
    // User created successfully. Respond with user info and JWT.
    // Include 'favorites' array, useful for initializing frontend state.
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [], // Include favorites (default to empty array if somehow missing)
      token: generateToken(user._id), // Generate JWT for the new user
      createdAt: user.createdAt,
    });
  } else {
    // This case might be rare if validation passes but creation fails unexpectedly.
    res.status(400);
    throw new Error('Invalid user data - user creation failed');
  }
}); // End asyncHandler

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Basic check for presence of credentials
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // --- Fetch user by email (case-insensitive) ---
  // Convert input email to lowercase for the lookup.
  // Explicitly select the password field which has `select: false` in the User schema.
  // Note: If 'favorites' is also set to `select: false` in the User model schema,
  // you might need to add '+favorites' here as well: .select('+password +favorites')
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+password'); // <-- Ensure password is selected for comparison

  // Check if user exists and if the provided password matches the stored hash.
  // The `matchPassword` method should be defined on the User model schema.
  // It now has access to `user.password` because we selected it above.
  if (user && (await user.matchPassword(password))) {
    // Authentication successful. Respond with user info and JWT.
    // Include 'favorites' array, useful for initializing frontend state.
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [], // Include favorites (default to empty array if somehow missing)
      token: generateToken(user._id), // Generate JWT for the logged-in user
      createdAt: user.createdAt,
    });
  } else {
    // Authentication failed (user not found or password incorrect).
    res.status(401); // Unauthorized
    throw new Error('Invalid email or password');
  }
}); // End asyncHandler

// --- Use NAMED exports ---
// Export controllers for use in route definitions.
export { registerUser, loginUser };
