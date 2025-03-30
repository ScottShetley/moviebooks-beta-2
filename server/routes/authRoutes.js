// server/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router ();

// Route for user registration
// Maps POST requests to /api/auth/register to the registerUser controller function
router.post ('/register', registerUser);

// Route for user login
// Maps POST requests to /api/auth/login to the loginUser controller function
router.post ('/login', loginUser);

export default router; // Export the router instance
