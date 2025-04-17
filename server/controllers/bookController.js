// server/controllers/bookController.js (ES Modules)
import Book from '../models/Book.js';
import Connection from '../models/Connection.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get book details by ID (basic info only)
// @route   GET /api/books/:id
// @access  Public
const getBookById = asyncHandler(async (req, res) => {
    const bookId = req.params.id;

    // Validate if the provided ID is a valid MongoDB ObjectId format.
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400);
        throw new Error('Invalid Book ID format');
    }

    // Attempt to find the book by its ID.
    const book = await Book.findById(bookId);

    if (book) {
        // If found, return the book details.
        res.json(book);
    } else {
        // If not found, return a 404 error.
        res.status(404);
        throw new Error('Book not found');
    }
});

// @desc    Get all connections associated with a specific book
// @route   GET /api/books/:id/connections
// @access  Public
const getBookConnections = asyncHandler(async (req, res) => {
    const bookId = req.params.id;

    // Validate if the provided ID is a valid MongoDB ObjectId format.
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400);
        throw new Error('Invalid Book ID format');
    }

    // Check if the book itself exists before fetching connections.
    // This ensures a 404 is returned if the book ID is valid but doesn't correspond to an existing book.
    const bookExists = await Book.findById(bookId);
    if (!bookExists) {
        res.status(404);
        throw new Error('Book not found');
    }

    // Find all connections where the bookRef matches the provided bookId.
    const connections = await Connection.find({ bookRef: bookId })
        // Populate referenced documents with specific fields for efficiency.
        .populate('userRef', 'username _id') // Get username and ID from the User document.
        .populate('movieRef', 'title _id')   // Get title and ID from the Movie document.
        .populate('bookRef', 'title _id')    // Get title and ID from the Book document (redundant here, but shows pattern).
        .sort({ createdAt: -1 }); // Sort connections by creation date, newest first.

    res.json(connections);
});

// --- Use NAMED exports ---
// Export controller functions for use in route definitions.
export { getBookById, getBookConnections };
