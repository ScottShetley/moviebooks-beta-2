// server/controllers/connectionController.js (ES Module Syntax)
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js'; // <-- CORRECT: Default import

// @desc    Create a new connection
// @route   POST /api/connections
// @access  Private
const createConnection = asyncHandler(async (req, res) => {
    const {
        movieTitle, movieYear, movieDirector,
        bookTitle, bookAuthor, bookYear,
        context
    } = req.body;
    const userId = req.user._id;

    if (!movieTitle || !bookTitle || !context) {
        res.status(400);
        throw new Error('Movie title, book title, and context are required.');
    }

    let moviePosterUrl = null, moviePosterPublicId = null;
    let bookCoverUrl = null, bookCoverPublicId = null;
    let screenshotUrl = null, screenshotPublicId = null;

    if (req.files) {
        if (req.files.moviePoster) {
            moviePosterUrl = req.files.moviePoster[0].path;
            moviePosterPublicId = req.files.moviePoster[0].filename;
        }
        if (req.files.bookCover) {
            bookCoverUrl = req.files.bookCover[0].path;
            bookCoverPublicId = req.files.bookCover[0].filename;
        }
        if (req.files.screenshot) {
            screenshotUrl = req.files.screenshot[0].path;
            screenshotPublicId = req.files.screenshot[0].filename;
        }
    }

    let movie = await Movie.findOne({ title: movieTitle, year: movieYear });
    if (!movie) {
        movie = await Movie.create({
            title: movieTitle,
            year: movieYear,
            director: movieDirector,
            posterImageUrl: moviePosterUrl,
            posterImagePublicId: moviePosterPublicId,
        });
    } else {
        if (!movie.posterImageUrl && moviePosterUrl) {
            movie.posterImageUrl = moviePosterUrl;
            movie.posterImagePublicId = moviePosterPublicId;
            if (movieDirector && !movie.director) {
                 movie.director = movieDirector;
            }
            await movie.save();
        }
    }

    let book = await Book.findOne({ title: bookTitle, author: bookAuthor });
    if (!book) {
        book = await Book.create({
            title: bookTitle,
            author: bookAuthor,
            publicationYear: bookYear,
            coverImageUrl: bookCoverUrl,
            coverImagePublicId: bookCoverPublicId,
        });
    } else {
        if (!book.coverImageUrl && bookCoverUrl) {
            book.coverImageUrl = bookCoverUrl;
            book.coverImagePublicId = bookCoverPublicId;
            if (bookYear && !book.publicationYear) {
                 book.publicationYear = bookYear;
            }
            await book.save();
        }
    }

    const connection = new Connection({
        userRef: userId,
        movieRef: movie._id,
        bookRef: book._id,
        context: context,
        screenshotImageUrl: screenshotUrl, // Ensure model field name matches
        screenshotImagePublicId: screenshotPublicId,
    });

    const createdConnection = await connection.save();

    const populatedConnection = await Connection.findById(createdConnection._id)
        .populate('userRef', 'username _id')
        .populate('movieRef')
        .populate('bookRef');

    if (!populatedConnection) {
        res.status(500);
        throw new Error("Failed to retrieve populated connection after creation.");
    }

    res.status(201).json(populatedConnection);
});

// @desc    Get all connections for the feed
// @route   GET /api/connections
// @access  Public
const getConnections = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Connection.countDocuments();

    const connections = await Connection.find({})
        .populate('userRef', 'username _id')
        .populate('movieRef')
        .populate('bookRef')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        connections,
        page,
        pages: Math.ceil(count / pageSize)
    });
});

// @desc    Like or unlike a connection
// @route   POST /api/connections/:id/like
// @access  Private
const likeConnection = asyncHandler(async (req, res) => {
    const connectionId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400); throw new Error('Invalid Connection ID format.');
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
        res.status(404); throw new Error('Connection not found.');
    }

    const alreadyLikedIndex = connection.likes.findIndex(likeId => likeId.equals(userId));
    let notification = null;

    if (alreadyLikedIndex > -1) {
        connection.likes.splice(alreadyLikedIndex, 1);
    } else {
        connection.likes.push(userId);
        if (!connection.userRef.equals(userId)) {
             notification = await Notification.create({
                recipient: connection.userRef,
                sender: userId,
                type: 'like',
                connectionRef: connectionId,
             });
        }
    }

    const updatedConnection = await connection.save();

    const populatedConnection = await Connection.findById(updatedConnection._id)
        .populate('userRef', 'username _id')
        .populate('movieRef')
        .populate('bookRef');

    if (!populatedConnection) {
        res.status(500); throw new Error("Failed to retrieve populated connection after like/unlike.");
    }

    res.json({
        connection: populatedConnection,
        notificationId: notification ? notification._id : null
    });
});

// @desc    Favorite or unfavorite a connection
// @route   POST /api/connections/:id/favorite
// @access  Private
const favoriteConnection = asyncHandler(async (req, res) => {
    const connectionId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400); throw new Error('Invalid Connection ID format.');
    }

    const connection = await Connection.findById(connectionId);
    const user = await User.findById(userId);

    if (!connection) { res.status(404); throw new Error('Connection not found.'); }
    if (!user) { res.status(404); throw new Error('User not found.'); }

    const alreadyFavoritedIndex = user.favorites.findIndex(favId => favId.equals(connectionId));

    if (alreadyFavoritedIndex > -1) {
        user.favorites.splice(alreadyFavoritedIndex, 1);
    } else {
        user.favorites.push(connectionId);
    }

    await user.save();
    // Note: Saving the connection might not be necessary unless it has hooks related to favorites
    // const updatedConnection = await connection.save();

     // Re-fetch and populate the connection to return its current state
     // Use connection._id directly as connection was already fetched
     const populatedConnection = await Connection.findById(connection._id)
        .populate('userRef', 'username _id')
        .populate('movieRef')
        .populate('bookRef');

     if (!populatedConnection) {
        res.status(500); throw new Error("Failed to retrieve populated connection after favorite/unfavorite.");
    }

    res.json(populatedConnection);
});


// @desc    Delete a connection
// @route   DELETE /api/connections/:id
// @access  Private (Owner only)
const deleteConnection = asyncHandler(async (req, res) => {
    const connectionId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400); throw new Error('Invalid Connection ID format.');
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
        res.status(404); throw new Error('Connection not found.');
    }

    if (!connection.userRef.equals(userId)) {
        res.status(403); throw new Error('User not authorized to delete this connection.');
    }

    // Delete associated Cloudinary screenshot
    if (connection.screenshotImagePublicId) { // Ensure model field name matches
        try {
            console.log(`Attempting to delete Cloudinary asset: ${connection.screenshotImagePublicId}`);
            // Use the imported default cloudinary object
            await cloudinary.uploader.destroy(connection.screenshotImagePublicId);
            console.log(`Successfully deleted Cloudinary asset: ${connection.screenshotImagePublicId}`);
        } catch (error) {
            console.error(`Cloudinary Deletion Error for ${connection.screenshotImagePublicId}:`, error);
        }
    } else {
        console.log(`No screenshotImagePublicId found for connection ${connectionId}, skipping Cloudinary deletion.`);
    }

    // Delete associated notifications
    await Notification.deleteMany({ connectionRef: connectionId });

    // Delete the connection document itself
    await Connection.deleteOne({ _id: connectionId });

    // Remove from users' favorites
    await User.updateMany(
        { favorites: connectionId },
        { $pull: { favorites: connectionId } }
    );

    // Orphaned Movie/Book cleanup is still a consideration for later
    console.log(`Connection ${connectionId} deleted. Associated movie/book records remain.`);

    res.status(200).json({ message: 'Connection deleted successfully.' });
});


// --- Export Controller Functions ---
export {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
};