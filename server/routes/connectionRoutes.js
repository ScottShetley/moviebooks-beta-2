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
    getConnectionsByIds
} from '../controllers/connectionController.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import { uploadConnectionImages } from '../middleware/uploadMiddleware.js'; // Handles multipart/form-data for connection creation

/**
 * Defines routes related to creating, fetching, updating, and deleting Connections.
 * Also includes routes for related actions like liking, favoriting, and managing comments.
 * Base Path: /api/connections (mounted in server.js or app.js)
 */
const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public, with filtering options via query params)
// POST /api/connections: Create a new connection (Private, requires login, handles image uploads)
router.route('/')
    .get(getConnections)
    .post(protect, uploadConnectionImages, createConnection); // Middleware runs in order: auth -> upload -> controller

// --- Route for Popular Tags ---
// GET /api/connections/popular-tags: Get most frequent tags used in connections (Public)
router.route('/popular-tags').get(getPopularTags);

// --- Route for Batch Fetching by IDs ---
// POST /api/connections/batch: Get multiple connections by their IDs (Private)
// Expects an array of connection IDs in the request body.
router.route('/batch')
    .post(protect, getConnectionsByIds);

// --- Route for User Specific Connections ---
// GET /api/connections/user/:userId: Get all connections created by a specific user (Public)
router.route('/user/:userId').get(getConnectionsByUserId);

// --- Routes for specific connections '/api/connections/:id' ---

// GET /api/connections/:id: Get single connection details (Public)
// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id')
    .get(getConnectionById)
    .delete(protect, deleteConnection); // Auth check happens in middleware, ownership check in controller

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);


// --- Routes for '/api/connections/:id/comments' ---
// Import comment controllers specifically for these nested routes
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js';

// GET /api/connections/:id/comments: Get comments for a specific connection (Public)
// POST /api/connections/:id/comments: Create a comment on a specific connection (Private)
router.route('/:id/comments')
    .get(getCommentsForConnection)
    .post(protect, createComment);


// --- Export the router ---
// Export the configured router instance for mounting in the main application file.
export default router;
