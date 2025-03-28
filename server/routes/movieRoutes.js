// server/routes/movieRoutes.js
const express = require('express');
const {
    getMovieById,
    getMovieConnections
} = require('../controllers/movieController.js');

const router = express.Router();

// --- Routes for '/api/movies/:id' ---

// GET /api/movies/:id: Get basic movie details (Public)
router.get('/:id', getMovieById);

// GET /api/movies/:id/connections: Get all connections for a specific movie (Public)
router.get('/:id/connections', getMovieConnections);

// Could add routes later for searching movies, etc.

module.exports = router;