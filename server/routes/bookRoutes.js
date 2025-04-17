// server/routes/bookRoutes.js
import express from 'express';
import { getBookById, getBookConnections } from '../controllers/bookController.js';

/**
 * Defines routes related to fetching book information and associated connections.
 * Base Path: /api/books (mounted in server.js or app.js)
 */
const router = express.Router();

// --- Routes for '/api/books/:id' ---

// GET /api/books/:id: Get basic book details (Public)
// Maps GET requests to /api/books/:id to the getBookById controller function.
router.get('/:id', getBookById);

// GET /api/books/:id/connections: Get all connections for a specific book (Public)
// Maps GET requests to /api/books/:id/connections to the getBookConnections controller function.
router.get('/:id/connections', getBookConnections);

// Could add routes later for searching books, etc.
// Example: router.get('/search', searchBooks);

// Export the router instance for mounting in the main application file.
export default router;
