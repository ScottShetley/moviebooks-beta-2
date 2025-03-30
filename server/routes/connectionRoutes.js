// server/routes/connectionRoutes.js
import express from 'express'; // Changed to import syntax for consistency if possible, otherwise keep require
import {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
} from '../controllers/connectionController.js'; // Ensure correct path and .js extension if using ES modules
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js'; // <-- Import comment controllers
import { protect } from '../middleware/authMiddleware.js'; // Middleware to protect routes
import uploadConnectionImages from '../middleware/uploadMiddleware.js'; // Import upload middleware

const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    .post(protect, uploadConnectionImages, createConnection);

// --- Routes for specific connections '/api/connections/:id' ---

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);

// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id').delete(protect, deleteConnection);

// --- Routes for comments on a specific connection '/api/connections/:id/comments' ---

// GET /api/connections/:id/comments: Get all comments for a connection (Public)
router.route('/:id/comments')
    .get(getCommentsForConnection); // <-- Add GET route

// POST /api/connections/:id/comments: Create a new comment for a connection (Private)
router.route('/:id/comments')
    .post(protect, createComment); // <-- Add POST route (protected)


// --- Potential Refinement ---
// You could combine the GET and POST for comments under a single .route('/:id/comments')
// like you did for '/' if preferred:
/*
router.route('/:id/comments')
  .get(getCommentsForConnection)
  .post(protect, createComment);
*/
// The way it is above (separate .get and .post) also works perfectly fine.

// module.exports = router; // Use export default if using ES Modules everywhere
export default router; // Assuming ES Module syntax based on controller/middleware imports