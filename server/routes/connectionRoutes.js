// server/routes/connectionRoutes.js
import express from 'express';

// Import controller functions
import {
    createConnection,
    getConnections,
    getConnectionById,
    likeConnection,
    favoriteConnection,
    deleteConnection,
    getPopularTags,
    getConnectionsByUserId,
    getConnectionsByIds,
    searchConnections // --- NEW: Import the search function ---
} from '../controllers/connectionController.js';

// Import comment controllers --- MOVED TO TOP ---
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js';
// --- END MOVED IMPORTS ---


// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import { uploadConnectionImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    .post(protect, uploadConnectionImages, createConnection);

// --- Route for Popular Tags ---
// GET /api/connections/popular-tags: Get most frequent tags (Public)
router.route('/popular-tags').get(getPopularTags);

// --- Route for Batch Fetching by IDs ---
// POST /api/connections/batch: Get multiple connections by ID (Private)
router.route('/batch')
    .post(protect, getConnectionsByIds); // Use POST, protect with auth

// --- Route for User Specific Connections ---
// GET /api/connections/user/:userId: Get connections created by a user (Public)
router.route('/user/:userId').get(getConnectionsByUserId);

// --- NEW: Route for searching connections ---
// GET /api/connections/search: Search connections by query (Public)
router.route('/search').get(searchConnections);
// --- END NEW ---


// --- Routes for specific connections '/api/connections/:id' ---

// GET /api/connections/:id: Get single connection details (Public)
// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id')
    .get(getConnectionById)
    .delete(protect, deleteConnection);

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);


// --- Routes for '/api/connections/:id/comments' ---
// GET /api/connections/:id/comments: Get comments for a connection (Public)
// POST /api/connections/:id/comments: Create a comment for a connection (Private)
router.route('/:id/comments')
    .get(getCommentsForConnection)
    .post(protect, createComment);


// --- Export the router ---
export default router;