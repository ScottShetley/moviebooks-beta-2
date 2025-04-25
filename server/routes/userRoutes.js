// server/routes/userRoutes.js
import express from 'express';
import {
  getMyProfile,
  updateUserProfile, // Handles text fields AND isPrivate now
  updateUserProfilePicture, // Import new controller function for picture
  getPublicUserProfile,
  getUserConnections,
  getPublicUsersList, // <-- Import the new controller function
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Standard strict protect
import { optionalProtect } from '../middleware/optionalAuthMiddleware.js'; // <-- NEW: Import optionalProtect
import { uploadProfilePicture } from '../middleware/uploadMiddleware.js'; // Import specific upload middleware

const router = express.Router();

// --- Routes for '/api/users' ---

// GET /api/users: Get a list of all public users (Public - no auth needed)
// Define this route before parameterized routes like /:userId
router.get('/', getPublicUsersList);

// GET /api/users/me: Get the profile of the currently logged-in user (Private - requires protect)
router.get('/me', protect, getMyProfile);

// PUT /api/users/profile: Update the profile TEXT fields (Private - requires protect)
router.put('/profile', protect, updateUserProfile);

// PUT /api/users/profile/picture: Upload/Update profile picture (Private - requires protect)
router.put(
    '/profile/picture',
    protect, // Ensure user is logged in
    uploadProfilePicture, // Use the single file upload middleware for 'profilePicture' field
    updateUserProfilePicture // Use the dedicated controller
);

// GET /api/users/:userId/profile: Get public profile info (Public for public profiles, accessible to owner if private)
// Use optionalProtect so req.user is available if logged in, but doesn't block logged out users.
router.get('/:userId/profile', optionalProtect, getPublicUserProfile); // <-- USE optionalProtect

// GET /api/users/:userId/connections: Get user's connections (Public for public profiles, accessible to owner if private)
// Use optionalProtect so req.user is available if logged in, but doesn't block logged out users.
router.get('/:userId/connections', optionalProtect, getUserConnections); // <-- USE optionalProtect


export default router;