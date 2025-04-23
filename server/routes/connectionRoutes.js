// server/routes/connectionRoutes.js
import express from 'express';

// Import controller functions
import {
    createConnection,
    getConnections,
    getConnectionById,
    // --- NEW: Import updateConnection controller ---
    updateConnection,
    // --- END NEW ---
    likeConnection,
    favoriteConnection,
    deleteConnection,
    getPopularTags,
    getConnectionsByUserId,
    getConnectionsByIds,
    searchConnections
} from '../controllers/connectionController.js';

// Import comment controllers
import {
    createComment,
    getCommentsForConnection
} from '../controllers/commentController.js';


// Import middleware
import { protect } from '../middleware/authMiddleware.js';
// --- We might need upload middleware for updates if screenshot can be changed ---
import { uploadConnectionImages } from '../middleware/uploadMiddleware.js';
// --- END upload middleware import ---


const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    .post(protect, uploadConnectionImages, createConnection); // uploadConnectionImages middleware handles image upload

// --- Route for Popular Tags ---
// GET /api/connections/popular-tags: Get most frequent tags (Public)
router.route('/popular-tags').get(getPopularTags);

// --- Route for Batch Fetching by IDs ---
// POST /api/connections/batch: Get multiple connections by ID (Private)
router.route('/batch')
    .post(protect, getConnectionsByIds);

// --- Route for User Specific Connections ---
// GET /api/connections/user/:userId: Get connections created by a user (Public)
router.route('/user/:userId').get(getConnectionsByUserId);

// --- Route for searching connections ---
// GET /api/connections/search: Search connections by query (Public)
router.route('/search').get(searchConnections);


// --- Routes for specific connections '/api/connections/:id' ---

// GET /api/connections/:id: Get single connection details (Public)
// PUT /api/connections/:id: Update a connection (Private, Owner only, handles upload)
// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id')
    .get(getConnectionById)
    // --- NEW: Add PUT method for update ---
    // Apply protect and upload middleware (upload middleware is important if images can be updated)
    .put(protect, uploadConnectionImages, updateConnection)
    // --- END NEW ---
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