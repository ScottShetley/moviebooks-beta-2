// server/routes/connectionRoutes.js
import express from 'express';

// Import controller functions (assuming named exports)
import {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
} from '../controllers/connectionController.js'; // Add .js extension

// Import middleware (assuming named export for protect, default for upload)
import { protect } from '../middleware/authMiddleware.js'; // Add .js extension
import uploadConnectionImages from '../middleware/uploadMiddleware.js'; // Add .js extension

const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    // Apply middleware and controller function correctly
    .post(protect, uploadConnectionImages, createConnection);

// --- Routes for specific connections '/api/connections/:id' ---

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);

// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id').delete(protect, deleteConnection);


// --- Routes for '/api/connections/:id/comments' ---
// Import comment controllers (assuming named exports)
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js'; // Add .js extension

// GET /api/connections/:id/comments: Get comments for a connection (Public)
// POST /api/connections/:id/comments: Create a comment for a connection (Private)
router.route('/:id/comments')
    .get(getCommentsForConnection)
    .post(protect, createComment); // Don't need upload middleware here


// --- Export the router using default export ---
export default router;