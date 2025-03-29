// server/controllers/connectionController.js
const Connection = require('../models/Connection.js');
const Movie = require('../models/Movie.js');
const Book = require('../models/Book.js');
const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary'); // Import configured Cloudinary instance

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

/**
 * @desc    Create a new MovieBook connection
 * @route   POST /api/connections
 * @access  Private
 */
const createConnection = async (req, res, next) => {
    const { movieTitle, bookTitle, context } = req.body;
    if (!req.user || !req.user._id) {
        console.error('[createConnection] Error: req.user is not defined or missing _id. Ensure protect middleware runs first.');
        return next(new Error('Authentication error: User not found.'));
    }
    const userId = req.user._id;

    const connectionData = {};

    try {
        console.log('[createConnection] Starting process...');
        console.log('[createConnection] Request Body:', JSON.stringify(req.body, null, 2));
        console.log('[createConnection] Authenticated User ID:', userId);
        if (req.files) {
            // Logging file details... (kept short for brevity)
            console.log('[createConnection] req.files details available.');
        } else {
            console.log('[createConnection] No req.files object found.');
        }

        if (!movieTitle || !bookTitle) {
            res.status(400); throw new Error('Movie title and Book title are required');
        }

        // Find or create Movie and Book
        console.log('[createConnection] Attempting findOrCreate Movie:', movieTitle);
        const movie = await findOrCreate(Movie, { title: movieTitle }, { title: movieTitle });
        console.log('[createConnection] Attempting findOrCreate Book:', bookTitle);
        const book = await findOrCreate(Book, { title: bookTitle }, { title: bookTitle });

        // Prepare core connection data
        connectionData.userRef = userId;
        connectionData.movieRef = movie._id;
        connectionData.bookRef = book._id;
        connectionData.context = context || '';

        // Process Uploaded Files from Cloudinary
        console.log('[createConnection] Processing uploaded files (if any)...');
        if (req.files) {
            if (req.files.moviePoster && req.files.moviePoster[0]) {
                connectionData.moviePosterUrl = req.files.moviePoster[0].path;
                connectionData.moviePosterPublicId = req.files.moviePoster[0].filename;
            }
            if (req.files.bookCover && req.files.bookCover[0]) {
                connectionData.bookCoverUrl = req.files.bookCover[0].path;
                connectionData.bookCoverPublicId = req.files.bookCover[0].filename;
            }
            if (req.files.screenshot && req.files.screenshot[0]) {
                connectionData.screenshotUrl = req.files.screenshot[0].path;
                connectionData.screenshotPublicId = req.files.screenshot[0].filename;
            }
        }

        // Create the connection
        console.log('[createConnection] Attempting Connection.create...');
        const connection = await Connection.create(connectionData);
        console.log('[createConnection] Connection document created. ID:', connection._id);

        // Populate and send response
        console.log('[createConnection] Attempting to populate created connection...');
        // --- MODIFICATION START: Populate username instead of email ---
        const populatedConnection = await Connection.findById(connection._id)
            .populate('userRef', 'username _id') // <-- SELECT USERNAME
            .populate('movieRef', 'title _id')   // <-- Also populate movie/book ID for links
            .populate('bookRef', 'title _id');    // <-- Also populate movie/book ID for links
        // --- MODIFICATION END ---
        console.log('[createConnection] Population complete.');

        if (!populatedConnection) {
            console.error(`[createConnection] CRITICAL: Connection created (ID: ${connection._id}) but failed to populate!`);
            res.status(404); throw new Error('Connection created but could not be retrieved for response.');
        }

        console.log('[createConnection] Sending success response (201).');
        res.status(201).json(populatedConnection); // Send populated connection back

    } catch (error) {
        console.error('!!!!!! ERROR CAUGHT in createConnection !!!!!!');
        console.error('Error Message:', error ? error.message : 'No message');
        // Add orphan checks here if needed
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
        console.log('[getConnections] Fetching connections...');
        // --- MODIFICATION START: Populate username instead of email ---
        const connections = await Connection.find({})
            .populate('userRef', 'username _id') // <-- SELECT USERNAME
            .populate('movieRef', 'title _id')
            .populate('bookRef', 'title _id')
            .sort({ createdAt: -1 })
            .limit(50); // Consider pagination later
        // --- MODIFICATION END ---
        console.log(`[getConnections] Found ${connections.length} connections.`);
        res.json(connections);
    } catch (error) {
        console.error('[getConnections] Error fetching connections:', error);
        next(error);
    }
};

/**
 * @desc    Like or unlike a connection
 * @route   POST /api/connections/:id/like
 * @access  Private
 */
const likeConnection = async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { return next(new Error('User not found for like action.')); }
    const userId = req.user._id;
    console.log(`[likeConnection] User ${userId} attempt like/unlike: ${connectionId}`);

    try {
        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400); throw new Error('Invalid Connection ID format');
        }
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            res.status(404); throw new Error('Connection not found');
        }

        const alreadyLiked = connection.likes.some(like => like.equals(userId));
        let updateOperation;
        let notificationCreated = false;

        if (alreadyLiked) {
            updateOperation = { $pull: { likes: userId } };
        } else {
            updateOperation = { $addToSet: { likes: userId } };
            if (!connection.userRef.equals(userId)) { notificationCreated = true; }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId, updateOperation, { new: true }
        ) // --- MODIFICATION START: Populate username consistently ---
         .populate('userRef', 'username _id') // <-- SELECT USERNAME
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');
        // --- MODIFICATION END ---

         if (!updatedConnection) {
             res.status(404); throw new Error('Connection not found after update attempt.');
         }
         console.log(`[likeConnection] Updated. Likes: ${updatedConnection.likes.length}`);

        if (notificationCreated) {
             console.log(`[likeConnection] Creating LIKE notification for ${connection.userRef}`);
            try {
                await Notification.create({
                    recipientRef: connection.userRef, senderRef: userId,
                    type: 'LIKE', connectionRef: connection._id,
                });
            } catch (notificationError) {
                console.error(`[likeConnection] Failed notification: ${notificationError.message}`);
            }
        }

        res.json(updatedConnection);

    } catch (error) {
         console.error(`[likeConnection] Error: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Favorite or unfavorite a connection
 * @route   POST /api/connections/:id/favorite
 * @access  Private
 */
const favoriteConnection = async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { return next(new Error('User not found for favorite action.')); }
    const userId = req.user._id;
    console.log(`[favoriteConnection] User ${userId} attempt favorite/unfavorite: ${connectionId}`);

    try {
         if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400); throw new Error('Invalid Connection ID format');
        }
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            res.status(404); throw new Error('Connection not found');
        }

        const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
        let updateOperation;
        let notificationCreated = false;

        if (alreadyFavorited) {
            updateOperation = { $pull: { favorites: userId } };
        } else {
            updateOperation = { $addToSet: { favorites: userId } };
            if (!connection.userRef.equals(userId)) { notificationCreated = true; }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId, updateOperation, { new: true }
        ) // --- MODIFICATION START: Populate username consistently ---
         .populate('userRef', 'username _id') // <-- SELECT USERNAME
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');
        // --- MODIFICATION END ---

         if (!updatedConnection) {
             res.status(404); throw new Error('Connection not found after update attempt.');
         }
         console.log(`[favoriteConnection] Updated. Favorites: ${updatedConnection.favorites.length}`);

         if (notificationCreated) {
            console.log(`[favoriteConnection] Creating FAVORITE notification for ${connection.userRef}`);
             try {
                 await Notification.create({
                    recipientRef: connection.userRef, senderRef: userId,
                    type: 'FAVORITE', connectionRef: connection._id,
                 });
             } catch (notificationError) {
                 console.error(`[favoriteConnection] Failed notification: ${notificationError.message}`);
             }
        }

        res.json(updatedConnection);

    } catch (error) {
        console.error(`[favoriteConnection] Error: ${error.message}`);
        next(error);
    }
};

// Delete function remains the same conceptually - no user info population needed in its response
const deleteConnection = async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { return next(new Error('User not found for delete action.')); }
    const userId = req.user._id;
    console.log(`[deleteConnection] User ${userId} attempt delete: ${connectionId}`);

    try {
        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            res.status(400); throw new Error('Invalid Connection ID format');
        }

        console.log(`[deleteConnection] Finding connection ${connectionId}...`);
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            console.log(`[deleteConnection] Connection ${connectionId} not found.`);
            res.status(404); throw new Error('Connection not found');
        }

        console.log(`[deleteConnection] Checking ownership...`);
        if (!connection.userRef.equals(userId)) {
            console.warn(`[deleteConnection] Auth failed. User ${userId} != owner ${connection.userRef}.`);
            res.status(403); throw new Error('User not authorized to delete this connection');
        }
        console.log(`[deleteConnection] Ownership verified.`);

        // Delete Images from Cloudinary
        const publicIdsToDelete = [
            connection.moviePosterPublicId,
            connection.bookCoverPublicId,
            connection.screenshotPublicId
        ].filter(Boolean); // Filter out null/undefined IDs

        if (publicIdsToDelete.length > 0) {
            console.log(`[deleteConnection] Deleting ${publicIdsToDelete.length} Cloudinary resource(s)...`);
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete, {
                    type: 'upload', resource_type: 'image'
                });
                console.log('[deleteConnection] Cloudinary deletion request sent.');
            } catch (cloudinaryError) {
                console.error(`[deleteConnection] CRITICAL ERROR deleting Cloudinary images:`, cloudinaryError);
                // Decide if stop or continue. Continuing...
            }
        }

        // Delete Connection from Database
        console.log(`[deleteConnection] Deleting connection doc ${connectionId}...`);
        await Connection.deleteOne({ _id: connectionId });
        console.log(`[deleteConnection] Connection doc ${connectionId} deleted.`);

        // Delete Associated Notifications
        console.log(`[deleteConnection] Deleting associated notifications...`);
        try {
            await Notification.deleteMany({ connectionRef: connectionId });
        } catch (notificationError) {
            console.error(`[deleteConnection] Error deleting notifications: ${notificationError.message}`);
        }

        console.log(`[deleteConnection] Sending success (200) for ${connectionId}.`);
        res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });

    } catch (error) {
        console.error(`[deleteConnection] Error: ${error.message}`);
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