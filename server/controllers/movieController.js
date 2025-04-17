// server/controllers/movieController.js (ES Modules)
import Movie from '../models/Movie.js';
import Connection from '../models/Connection.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get movie details by ID (basic info only)
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = asyncHandler(async (req, res) => {
    const movieId = req.params.id;

    // Validate if the provided ID is a valid MongoDB ObjectId format.
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400);
        throw new Error('Invalid Movie ID format');
    }

    // Attempt to find the movie by its ID.
    const movie = await Movie.findById(movieId);

    if (movie) {
        // If found, return the movie details.
        res.json(movie);
    } else {
        // If not found, return a 404 error.
        res.status(404);
        throw new Error('Movie not found');
    }
});

// @desc    Get all connections associated with a specific movie
// @route   GET /api/movies/:id/connections
// @access  Public
const getMovieConnections = asyncHandler(async (req, res) => {
    const movieId = req.params.id;

    // Validate if the provided ID is a valid MongoDB ObjectId format.
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400);
        throw new Error('Invalid Movie ID format');
    }

    // Check if the movie itself exists before fetching connections.
    // This ensures a 404 is returned if the movie ID is valid but doesn't correspond to an existing movie.
    const movieExists = await Movie.findById(movieId);
    if (!movieExists) {
        res.status(404);
        throw new Error('Movie not found');
    }

    // Find all connections where the movieRef matches the provided movie ID.
    const connections = await Connection.find({ movieRef: movieId })
        // Populate referenced documents with specific fields for efficiency.
        .populate('userRef', 'username _id') // Get username and ID from the User document.
        .populate('movieRef', 'title _id')   // Get title and ID from the Movie document.
        .populate('bookRef', 'title _id')    // Get title and ID from the Book document.
        .sort({ createdAt: -1 }); // Sort connections by creation date, newest first.

    res.json(connections);
});

// --- Use NAMED exports ---
// Export controller functions for use in route definitions.
export { getMovieById, getMovieConnections };
