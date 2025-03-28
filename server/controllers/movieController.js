// server/controllers/movieController.js
const Movie = require('../models/Movie.js');
const Connection = require('../models/Connection.js');
const mongoose = require('mongoose');

/**
 * @desc    Get movie details by ID (basic info only)
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res, next) => {
  try {
    const movieId = req.params.id;
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400);
        throw new Error('Invalid Movie ID format');
    }

    const movie = await Movie.findById(movieId);

    if (movie) {
      res.json(movie); // Send movie data
    } else {
      res.status(404); // Not Found
      throw new Error('Movie not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all connections associated with a specific movie
 * @route   GET /api/movies/:id/connections
 * @access  Public
 */
const getMovieConnections = async (req, res, next) => {
   try {
     const movieId = req.params.id;
     // Validate ID format
     if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400);
        throw new Error('Invalid Movie ID format');
     }

     // Optional: Check if the movie actually exists first
     const movieExists = await Movie.findById(movieId);
     if (!movieExists) {
       res.status(404);
       throw new Error('Movie not found');
     }

     // Find connections referencing this movie ID
     const connections = await Connection.find({ movieRef: movieId })
       .populate('userRef', 'email _id') // Populate user info
       .populate('movieRef', 'title _id') // Populate movie title/ID
       .populate('bookRef', 'title _id')  // Populate book title/ID
       .sort({ createdAt: -1 });         // Sort by newest first

     res.json(connections); // Send the list of connections
   } catch (error) {
     next(error);
   }
};


module.exports = { getMovieById, getMovieConnections };