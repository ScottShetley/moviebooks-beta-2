// server/routes/movieRoutes.js
import express from 'express';
import {
  getMovieById,
  getMovieConnections,
} from '../controllers/movieController.js';

/**
 * Defines routes related to fetching movie information and associated connections.
 * Base Path: /api/movies (mounted in server.js or app.js)
 */
const router = express.Router(); // Consistent spacing

// --- Routes for '/api/movies/:id' ---

// GET /api/movies/:id: Get basic movie details (Public)
// Maps GET requests to /api/movies/:id to the getMovieById controller function.
router.get('/:id', getMovieById); // Consistent spacing

// GET /api/movies/:id/connections: Get all connections for a specific movie (Public)
// Maps GET requests to /api/movies/:id/connections to the getMovieConnections controller function.
router.get('/:id/connections', getMovieConnections); // Consistent spacing

// Could add routes later for searching movies, etc.
// Example: router.get('/search', searchMovies);

// Export the router instance for mounting in the main application file.
export default router;
