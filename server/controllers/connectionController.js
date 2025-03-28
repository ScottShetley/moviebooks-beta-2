// server/controllers/connectionController.js
const Connection = require('../models/Connection.js');
const Movie = require('../models/Movie.js');
const Book = require('../models/Book.js');
const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');
const fs = require('fs').promises; // Use promises version of fs
const path = require('path');

// Helper function to find or create Movie/Book atomically
const findOrCreate = async (model, query, data) => {
    const options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true
    };
    const collation = { locale: 'en', strength: 2 };
    return await model.findOneAndUpdate(query, data, options).collation(collation);
};

// Helper function to safely delete a file, logging errors
const deleteFileIfExists = async (filePath, fileNameForLog) => {
    if (!filePath) return; // Do nothing if path is null/undefined
    try {
        await fs.unlink(filePath);
        console.log(`Deleted image file: ${fileNameForLog || filePath}`);
    } catch (fileError) {
        // Log error if file doesn't exist or other permission issues
        if (fileError.code !== 'ENOENT') { // ENOENT = Error NO ENtry (file not found) - often expected/ok
            console.error(`Failed to delete image file ${fileNameForLog || filePath}: ${fileError.message}`);
        } else {
             console.log(`Image file not found, skipping deletion: ${fileNameForLog || filePath}`);
        }
        // Don't throw error, allow connection deletion to proceed
    }
};

/**
 * @desc    Create a new MovieBook connection
 * @route   POST /api/connections
 * @access  Private
 */
const createConnection = async (req, res, next) => {
    const { movieTitle, bookTitle, context } = req.body;
    const userId = req.user._id;

    // --- MODIFIED: Initialize URLs ---
    let moviePosterUrl = null;
    let bookCoverUrl = null;
    let screenshotUrl = null;
    const uploadedFiles = []; // Keep track of files physically saved

    try {
        if (!movieTitle || !bookTitle) {
            res.status(400);
            throw new Error('Movie title and Book title are required');
        }

        const movie = await findOrCreate(Movie, { title: movieTitle }, { title: movieTitle });
        const book = await findOrCreate(Book, { title: bookTitle }, { title: bookTitle });

        // --- MODIFIED: Process multiple files from req.files ---
        if (req.files) {
            if (req.files.moviePoster && req.files.moviePoster[0]) {
                moviePosterUrl = `/uploads/${req.files.moviePoster[0].filename}`;
                uploadedFiles.push(req.files.moviePoster[0]);
                console.log(`Movie Poster uploaded: ${moviePosterUrl}`);
            }
            if (req.files.bookCover && req.files.bookCover[0]) {
                bookCoverUrl = `/uploads/${req.files.bookCover[0].filename}`;
                uploadedFiles.push(req.files.bookCover[0]);
                console.log(`Book Cover uploaded: ${bookCoverUrl}`);
            }
            if (req.files.screenshot && req.files.screenshot[0]) {
                screenshotUrl = `/uploads/${req.files.screenshot[0].filename}`;
                uploadedFiles.push(req.files.screenshot[0]);
                console.log(`Screenshot uploaded: ${screenshotUrl}`);
            }
        }
        // --- END MODIFICATION ---

        const connection = await Connection.create({
            userRef: userId,
            movieRef: movie._id,
            bookRef: book._id,
            context: context || '',
            // --- MODIFIED: Save all three URLs ---
            moviePosterUrl,
            bookCoverUrl,
            screenshotUrl,
            // --- END MODIFICATION ---
        });

        const populatedConnection = await Connection.findById(connection._id)
            .populate('userRef', 'email _id')
            .populate('movieRef', 'title')
            .populate('bookRef', 'title');

        if (!populatedConnection) {
            res.status(404);
            throw new Error('Connection created but could not be retrieved for response.');
        }

        res.status(201).json(populatedConnection);

    } catch (error) {
        // --- MODIFIED: Cleanup potentially multiple orphaned files on error ---
        if (uploadedFiles.length > 0 && error) {
             console.warn(`Error during connection creation (${error.message}). Attempting to delete ${uploadedFiles.length} uploaded file(s)...`);
             for (const file of uploadedFiles) {
                 const tempFilePath = path.join(__dirname, '..', 'uploads', file.filename);
                 await deleteFileIfExists(tempFilePath, file.filename); // Use helper for deletion
             }
         }
        // --- END MODIFICATION ---
        next(error);
    }
};

/**
 * @desc    Get all connections (feed)
 * @route   GET /api/connections
 * @access  Public
 */
const getConnections = async (req, res, next) => {
    try {
        const connections = await Connection.find({})
            .populate('userRef', 'email _id')
            .populate('movieRef', 'title _id')
            .populate('bookRef', 'title _id')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(connections);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Like or unlike a connection
 * @route   POST /api/connections/:id/like
 * @access  Private
 */
const likeConnection = async (req, res, next) => {
    // ... (likeConnection logic remains the same)
    const connectionId = req.params.id;
    const userId = req.user._id;

    try {
        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400);
            throw new Error('Invalid Connection ID format');
        }
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            res.status(404);
            throw new Error('Connection not found');
        }

        const alreadyLiked = connection.likes.some(like => like.equals(userId));
        let updateOperation;
        let notificationCreated = false;

        if (alreadyLiked) {
            updateOperation = { $pull: { likes: userId } };
        } else {
            updateOperation = { $addToSet: { likes: userId } };
            if (!connection.userRef.equals(userId)) {
                notificationCreated = true;
            }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId,
            updateOperation,
            { new: true }
        ).populate('userRef', 'email _id')
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');

        if (!updatedConnection) {
             res.status(404);
             throw new Error('Connection not found after update attempt.');
        }

        if (notificationCreated) {
            try {
                await Notification.create({
                    recipientRef: connection.userRef,
                    senderRef: userId,
                    type: 'LIKE',
                    connectionRef: connection._id,
                });
                 console.log(`Notification created for LIKE on connection ${connection._id} for user ${connection.userRef}`);
            } catch (notificationError) {
                console.error(`Failed to create LIKE notification: ${notificationError.message}`);
            }
        }

        res.json(updatedConnection);

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Favorite or unfavorite a connection
 * @route   POST /api/connections/:id/favorite
 * @access  Private
 */
const favoriteConnection = async (req, res, next) => {
    // ... (favoriteConnection logic remains the same)
    const connectionId = req.params.id;
    const userId = req.user._id;

    try {
         if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400);
            throw new Error('Invalid Connection ID format');
        }
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            res.status(404);
            throw new Error('Connection not found');
        }

        const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
        let updateOperation;
        let notificationCreated = false;

        if (alreadyFavorited) {
            updateOperation = { $pull: { favorites: userId } };
        } else {
            updateOperation = { $addToSet: { favorites: userId } };
            if (!connection.userRef.equals(userId)) {
                notificationCreated = true;
            }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId,
            updateOperation,
            { new: true }
        ).populate('userRef', 'email _id')
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');

         if (!updatedConnection) {
             res.status(404);
             throw new Error('Connection not found after update attempt.');
        }

         if (notificationCreated) {
             try {
                 await Notification.create({
                    recipientRef: connection.userRef,
                    senderRef: userId,
                    type: 'FAVORITE',
                    connectionRef: connection._id,
                 });
                 console.log(`Notification created for FAVORITE on connection ${connection._id} for user ${connection.userRef}`);
             } catch (notificationError) {
                 console.error(`Failed to create FAVORITE notification: ${notificationError.message}`);
             }
        }

        res.json(updatedConnection);

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a connection
 * @route   DELETE /api/connections/:id
 * @access  Private (Owner only)
 */
const deleteConnection = async (req, res, next) => {
    const connectionId = req.params.id;
    const userId = req.user._id;

    try {
        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400); throw new Error('Invalid Connection ID format');
        }

        const connection = await Connection.findById(connectionId);
        if (!connection) {
            res.status(404); throw new Error('Connection not found');
        }

        if (!connection.userRef.equals(userId)) {
            res.status(403); throw new Error('User not authorized to delete this connection');
        }

        // --- MODIFIED: Delete all associated image files ---
        // Store URLs before deleting connection doc
        const urlsToDelete = [
            connection.moviePosterUrl,
            connection.bookCoverUrl,
            connection.screenshotUrl
        ];

        console.log(`Preparing to delete connection ${connectionId}. Checking for associated files...`);

        for (const url of urlsToDelete) {
            if (url) { // Only attempt delete if URL exists
                 try {
                    const filename = path.basename(url);
                    const filePath = path.join(__dirname, '..', 'uploads', filename);
                    await deleteFileIfExists(filePath, filename); // Use helper
                 } catch (loopError) {
                     // Errors inside deleteFileIfExists are logged, but we catch here just in case
                     console.error(`Unexpected error processing file ${url} for deletion: ${loopError.message}`);
                 }
            }
        }
        // --- END MODIFICATION ---

        await Connection.deleteOne({ _id: connectionId });
        console.log(`Deleted connection document: ${connectionId}`);

        const { deletedCount } = await Notification.deleteMany({ connectionRef: connectionId });
        console.log(`Deleted ${deletedCount} related notification(s) for connection ${connectionId}`);

        res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
};