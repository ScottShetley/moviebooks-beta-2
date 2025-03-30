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
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400); throw new Error('Invalid Movie ID format');
    }
    const movie = await Movie.findById(movieId);
    if (movie) {
        res.json(movie);
    } else {
        res.status(404); throw new Error('Movie not found');
    }
});

// @desc    Get all connections associated with a specific movie
// @route   GET /api/movies/:id/connections
// @access  Public
const getMovieConnections = asyncHandler(async (req, res) => {
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        res.status(400); throw new Error('Invalid Movie ID format');
    }
    const movieExists = await Movie.findById(movieId);
    if (!movieExists) {
        res.status(404); throw new Error('Movie not found');
    }
    const connections = await Connection.find({ movieRef: movieId })
        .populate('userRef', 'username _id') // <-- Updated to username
        .populate('movieRef', 'title _id')
        .populate('bookRef', 'title _id')
        .sort({ createdAt: -1 });
    res.json(connections);
});

// --- Use NAMED exports ---
export { getMovieById, getMovieConnections };