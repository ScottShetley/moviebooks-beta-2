// server/routes/userRoutes.js
import express from 'express';
import {
  getMyProfile,
  updateUserProfile, // Handles text fields only (displayName, bio, location)
  updateUserProfilePicture, // Handles profile picture upload and update
  getPublicUserProfile,
  getUserConnections,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Middleware for authentication
import { uploadProfilePicture } from '../middleware/uploadMiddleware.js'; // Middleware for single profile picture upload

/**
 * Defines routes related to fetching and updating user profiles and user-specific data.
 * Base Path: /api/users (mounted in server.js or app.js)
 */
const router = express.Router();

// --- Routes for the Logged-in User ---

// GET /api/users/me: Get the detailed profile of the currently logged-in user (Private)
router.get('/me', protect, getMyProfile);

// PUT /api/users/profile: Update the profile TEXT fields (displayName, bio, location) (Private)
// This route handles updates from the main profile form save action.
router.put('/profile', protect, updateUserProfile);

// PUT /api/users/profile/picture: Upload/Update profile picture (Private)
// This route specifically handles the file upload via middleware.
router.put(
    '/profile/picture',
    protect, // 1. Ensure user is logged in
    uploadProfilePicture, // 2. Use the single file upload middleware for 'profilePicture' field
    updateUserProfilePicture // 3. Use the dedicated controller to update the user document
);

// --- Routes for Specific User IDs (Public) ---

// GET /api/users/:userId/profile: Get public profile information for a specific user (Public)
router.get('/:userId/profile', getPublicUserProfile);

// GET /api/users/:userId/connections: Get all connections created by a specific user (Public)
router.get('/:userId/connections', getUserConnections);

// Export the router instance for mounting in the main application file.
export default router;
