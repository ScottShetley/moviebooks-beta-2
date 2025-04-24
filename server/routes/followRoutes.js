// server/routes/followRoutes.js
import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  isFollowing
} from '../controllers/followController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming you have authMiddleware with a protect function

const router = express.Router(); // Now placed AFTER all imports

// --- Routes ---

// Route to follow a user (requires authentication)
// POST to /api/follows/:userId where :userId is the ID of the user to follow
router.route('/:userId').post(protect, followUser);

// Route to unfollow a user (requires authentication)
// DELETE to /api/follows/:userId where :userId is the ID of the user to unfollow
router.route('/:userId').delete(protect, unfollowUser);

// Route to get the list of users that a specific user is following (public)
// GET to /api/follows/following/:userId where :userId is the ID of the user whose following list is requested
router.route('/following/:userId').get(getFollowing);

// Route to get the list of users that are following a specific user (public)
// GET to /api/follows/followers/:userId where :userId is the ID of the user whose followers list is requested
router.route('/followers/:userId').get(getFollowers);

// Route to check if the currently authenticated user is following a specific user (private)
// GET to /api/follows/is-following/:userId where :userId is the ID of the user to check against
router.route('/is-following/:userId').get(protect, isFollowing);


export default router;