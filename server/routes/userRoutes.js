// server/routes/userRoutes.js
import express from 'express';
import {
  getUserProfile,
  getUserConnections,
} from '../controllers/userController.js';
import {protect} from '../middleware/authMiddleware.js'; // Need protect for 'me' route

const router = express.Router ();

// --- Routes for '/api/users' ---

// GET /api/users/me: Get the profile of the currently logged-in user (Private)
// Uses 'me' as a specific identifier instead of an ID
router.get ('/me', protect, getUserProfile);

// GET /api/users/:userId/connections: Get connections for a specific user profile (Public)
// This route uses a dynamic parameter :userId
router.get ('/:userId/connections', getUserConnections);

// Could add routes later for updating user profile, getting user list (admin), etc.

export default router;
