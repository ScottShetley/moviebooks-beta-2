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
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400); throw new Error('Invalid Book ID format');
    }
    const book = await Book.findById(bookId);
    if (book) {
        res.json(book);
    } else {
        res.status(404); throw new Error('Book not found');
    }
});

// @desc    Get all connections associated with a specific book
// @route   GET /api/books/:id/connections
// @access  Public
const getBookConnections = asyncHandler(async (req, res) => {
    const bookId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400); throw new Error('Invalid Book ID format');
    }
    const bookExists = await Book.findById(bookId);
    if (!bookExists) {
        res.status(404); throw new Error('Book not found');
    }
    const connections = await Connection.find({ bookRef: bookId })
        .populate('userRef', 'username _id') // <-- Updated to username
        .populate('movieRef', 'title _id')
        .populate('bookRef', 'title _id')
        .sort({ createdAt: -1 });
    res.json(connections);
});

// --- Use NAMED exports ---
export { getBookById, getBookConnections };