// server/controllers/bookController.js
const Book = require('../models/Book.js');
const Connection = require('../models/Connection.js');
const mongoose = require('mongoose');

/**
 * @desc    Get book details by ID (basic info only)
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBookById = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    // Validate ID
     if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400);
        throw new Error('Invalid Book ID format');
     }

    const book = await Book.findById(bookId);

    if (book) {
      res.json(book);
    } else {
      res.status(404);
      throw new Error('Book not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all connections associated with a specific book
 * @route   GET /api/books/:id/connections
 * @access  Public
 */
const getBookConnections = async (req, res, next) => {
   try {
     const bookId = req.params.id;
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
         res.status(400);
         throw new Error('Invalid Book ID format');
      }

      // Optional: Check if the book exists first
     const bookExists = await Book.findById(bookId);
     if (!bookExists) {
       res.status(404);
       throw new Error('Book not found');
     }

     // Find connections referencing this book ID
     const connections = await Connection.find({ bookRef: bookId })
       .populate('userRef', 'email _id')
       .populate('movieRef', 'title _id')
       .populate('bookRef', 'title _id')
       .sort({ createdAt: -1 });

     res.json(connections);
   } catch (error) {
     next(error);
   }
};


module.exports = { getBookById, getBookConnections };