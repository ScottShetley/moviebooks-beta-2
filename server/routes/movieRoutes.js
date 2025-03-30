// server/routes/movieRoutes.js (Corrected for ES Modules)
import express from 'express'; // <-- Use import
import {
  getMovieById,
  getMovieConnections,
} from '../controllers/movieController.js'; // <-- Use import

const router = express.Router ();

// --- Routes for '/api/movies/:id' ---

// GET /api/movies/:id: Get basic movie details (Public)
router.get ('/:id', getMovieById);

// GET /api/movies/:id/connections: Get all connections for a specific movie (Public)
router.get ('/:id/connections', getMovieConnections);

// Could add routes later for searching movies, etc.

export default router; // This was likely already correct
