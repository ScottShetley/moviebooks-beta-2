// server/routes/userRoutes.js
import express from 'express';
import {
  getMyProfile,
  updateUserProfile, // Renamed import (Handles text fields only)
  updateUserProfilePicture, // Import new controller function for picture
  getPublicUserProfile,
  getUserConnections,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePicture } from '../middleware/uploadMiddleware.js'; // Import specific upload middleware

const router = express.Router();

// --- Routes for '/api/users' ---

// GET /api/users/me: Get the profile of the currently logged-in user (Private)
router.get('/me', protect, getMyProfile);

// PUT /api/users/profile: Update the profile TEXT fields (Private)
// This route handles displayName, bio, location updates from the form's main save.
router.put('/profile', protect, updateUserProfile);

// --- NEW ROUTE: Update Profile Picture ---
// PUT /api/users/profile/picture: Upload/Update profile picture (Private)
// This route specifically handles the file upload via middleware.
router.put(
    '/profile/picture',
    protect, // Ensure user is logged in
    uploadProfilePicture, // Use the single file upload middleware for 'profilePicture' field
    updateUserProfilePicture // Use the dedicated controller
);
// --- END NEW ROUTE ---

// GET /api/users/:userId/profile: Get public profile info (Public)
router.get('/:userId/profile', getPublicUserProfile);

// GET /api/users/:userId/connections: Get user's connections (Public)
router.get('/:userId/connections', getUserConnections);


export default router;