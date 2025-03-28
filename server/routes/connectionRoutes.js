// server/routes/connectionRoutes.js
const express = require('express');
const {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection // <-- ADDED import
} = require('../controllers/connectionController.js');
const { protect } = require('../middleware/authMiddleware.js'); // Middleware to protect routes
const handleUpload = require('../middleware/uploadMiddleware.js'); // Middleware to handle file uploads

const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    .post(protect, handleUpload, createConnection); // Apply protect and upload middleware only to POST

// --- Routes for '/api/connections/:id' ---
// Note: We don't have GET /api/connections/:id for a single connection detail page in BETA, but could add later.

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);

// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
// This single line defines the route and applies middleware + controller
router.route('/:id').delete(protect, deleteConnection); // <-- ADDED ROUTE DEFINITION

module.exports = router;