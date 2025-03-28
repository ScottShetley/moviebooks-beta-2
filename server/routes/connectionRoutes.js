// server/routes/connectionRoutes.js
const express = require('express');
const {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
} = require('../controllers/connectionController.js');
const { protect } = require('../middleware/authMiddleware.js'); // Middleware to protect routes
// --- UPDATED: Import the new middleware instance ---
const uploadConnectionImages = require('../middleware/uploadMiddleware.js');

const router = express.Router();

// --- Routes for '/api/connections' ---

// GET /api/connections: Get the main feed (Public)
// POST /api/connections: Create a new connection (Private, requires login, handles upload)
router.route('/')
    .get(getConnections)
    // --- UPDATED: Use the new middleware instance ---
    .post(protect, uploadConnectionImages, createConnection);

// --- Routes for '/api/connections/:id' ---

// POST /api/connections/:id/like: Like/Unlike a connection (Private)
router.route('/:id/like').post(protect, likeConnection);

// POST /api/connections/:id/favorite: Favorite/Unfavorite a connection (Private)
router.route('/:id/favorite').post(protect, favoriteConnection);

// DELETE /api/connections/:id: Delete a connection (Private, Owner only)
router.route('/:id').delete(protect, deleteConnection);

module.exports = router;