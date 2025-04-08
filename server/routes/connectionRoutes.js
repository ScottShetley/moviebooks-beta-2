// server/routes/connectionRoutes.js
import express from 'express';

// Import controller functions
import {
    createConnection,
    getConnections,
    getConnectionById, // <-- Added import (NEW)
    likeConnection,
    favoriteConnection,
    deleteConnection,
    getPopularTags,
    getConnectionsByUserId,
    getConnectionsByIds
} from '../controllers/connectionController.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import uploadConnectionImages from '../middleware/uploadMiddleware.js';

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

// --- Routes for specific connections '/api/connections/:id' ---

// GET /api/connections/:id: Get single connection details (Public - NEW)
// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id')
    .get(getConnectionById) // <-- Added route handler (NEW)
    .delete(protect, deleteConnection);

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);


// --- Routes for '/api/connections/:id/comments' ---
// Import comment controllers
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js';

// GET /api/connections/:id/comments: Get comments for a connection (Public)
// POST /api/connections/:id/comments: Create a comment for a connection (Private)
router.route('/:id/comments')
    .get(getCommentsForConnection)
    .post(protect, createComment);


// --- Export the router ---
export default router;