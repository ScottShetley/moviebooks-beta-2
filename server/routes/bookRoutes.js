// server/routes/bookRoutes.js
const express = require('express');
const {
    getBookById,
    getBookConnections
} = require('../controllers/bookController.js');

const router = express.Router();

// --- Routes for '/api/books/:id' ---

// GET /api/books/:id: Get basic book details (Public)
router.get('/:id', getBookById);

// GET /api/books/:id/connections: Get all connections for a specific book (Public)
router.get('/:id/connections', getBookConnections);

// Could add routes later for searching books, etc.

module.exports = router;