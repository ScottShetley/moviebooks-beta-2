// server/controllers/connectionController.js
const Connection = require('../models/Connection.js');
const Movie = require('../models/Movie.js');
const Book = require('../models/Book.js');
const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary'); // Import configured Cloudinary instance

// Helper function to find or create Movie/Book atomically (Kept your helper)
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
    // Ensure req.user exists (should be added by 'protect' middleware)
    if (!req.user || !req.user._id) {
        console.error('[createConnection] Error: req.user is not defined or missing _id. Ensure protect middleware runs first.');
        return next(new Error('Authentication error: User not found.')); // Pass a proper error
    }
    const userId = req.user._id;

    const connectionData = {}; // Build the data object progressively

    try {
        // --- TRACE LOGGING ---
        console.log('[createConnection] Starting process...');
        console.log('[createConnection] Request Body:', JSON.stringify(req.body, null, 2));
        console.log('[createConnection] Authenticated User ID:', userId);
        // Log file details carefully, avoid logging buffer content
        if (req.files) {
            const fileDetails = {};
            for (const field in req.files) {
                fileDetails[field] = req.files[field].map(f => ({
                    originalname: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size,
                    // Log Cloudinary-specific info if available (path=URL, filename=public_id)
                    path: f.path,
                    filename: f.filename
                }));
            }
            console.log('[createConnection] req.files details:', JSON.stringify(fileDetails, null, 2));
        } else {
            console.log('[createConnection] No req.files object found.');
        }
        // --- END TRACE LOGGING ---

        if (!movieTitle || !bookTitle) {
            res.status(400); // Set status code before throwing
            throw new Error('Movie title and Book title are required');
        }

        // Find or create Movie and Book
        console.log('[createConnection] Attempting findOrCreate Movie:', movieTitle);
        const movie = await findOrCreate(Movie, { title: movieTitle }, { title: movieTitle });
        console.log('[createConnection] Found/Created Movie ID:', movie._id);

        console.log('[createConnection] Attempting findOrCreate Book:', bookTitle);
        const book = await findOrCreate(Book, { title: bookTitle }, { title: bookTitle });
        console.log('[createConnection] Found/Created Book ID:', book._id);

        // Prepare core connection data
        connectionData.userRef = userId;
        connectionData.movieRef = movie._id;
        connectionData.bookRef = book._id;
        connectionData.context = context || '';

        // Process Uploaded Files from Cloudinary
        console.log('[createConnection] Processing uploaded files (if any)...');
        if (req.files) {
            if (req.files.moviePoster && req.files.moviePoster[0]) {
                connectionData.moviePosterUrl = req.files.moviePoster[0].path; // Cloudinary secure URL
                connectionData.moviePosterPublicId = req.files.moviePoster[0].filename; // Cloudinary public ID
                console.log(`[createConnection] Movie Poster processed: URL=${connectionData.moviePosterUrl}, ID=${connectionData.moviePosterPublicId}`);
            }
            if (req.files.bookCover && req.files.bookCover[0]) {
                connectionData.bookCoverUrl = req.files.bookCover[0].path;
                connectionData.bookCoverPublicId = req.files.bookCover[0].filename;
                console.log(`[createConnection] Book Cover processed: URL=${connectionData.bookCoverUrl}, ID=${connectionData.bookCoverPublicId}`);
            }
            if (req.files.screenshot && req.files.screenshot[0]) {
                connectionData.screenshotUrl = req.files.screenshot[0].path;
                connectionData.screenshotPublicId = req.files.screenshot[0].filename;
                console.log(`[createConnection] Screenshot processed: URL=${connectionData.screenshotUrl}, ID=${connectionData.screenshotPublicId}`);
            }
        } else {
             console.log('[createConnection] No files found in req.files to process.');
        }

        // Create the connection in the database
        console.log('[createConnection] Attempting Connection.create with data:', JSON.stringify(connectionData, null, 2));
        const connection = await Connection.create(connectionData);
        console.log('[createConnection] Connection document created successfully. ID:', connection._id);

        // Populate and send response
        console.log('[createConnection] Attempting to populate created connection...');
        const populatedConnection = await Connection.findById(connection._id)
            .populate('userRef', 'email _id')
            .populate('movieRef', 'title')
            .populate('bookRef', 'title');
        console.log('[createConnection] Population complete.');

        if (!populatedConnection) {
            // This case is less likely now but good defensive coding
            console.error(`[createConnection] CRITICAL: Connection created (ID: ${connection._id}) but failed to populate!`);
            res.status(404);
            throw new Error('Connection created but could not be retrieved for response.');
        }

        console.log('[createConnection] Sending success response (201).');
        res.status(201).json(populatedConnection);

    } catch (error) {
        // --- DETAILED ERROR LOGGING in CATCH Block ---
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!!!!! ERROR CAUGHT in createConnection !!!!!!');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error Object:', error); // Log the full error object for inspection
        console.error('Error Message:', error ? error.message : 'No error message available');
        console.error('Error Stack:', error ? error.stack : 'No stack trace available');
        console.error('--- Context ---');
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        console.error('User ID:', userId || 'Not available');
        console.error('Connection Data before crash (if available):', JSON.stringify(connectionData, null, 2));
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        // --- END DETAILED ERROR LOGGING ---


        // --- Original Orphan Warning Logic (Keep this) ---
        if (connectionData.moviePosterPublicId) console.warn(`[Error Context] Potential orphan Cloudinary image: ${connectionData.moviePosterPublicId}`);
        if (connectionData.bookCoverPublicId) console.warn(`[Error Context] Potential orphan Cloudinary image: ${connectionData.bookCoverPublicId}`);
        if (connectionData.screenshotPublicId) console.warn(`[Error Context] Potential orphan Cloudinary image: ${connectionData.screenshotPublicId}`);
        // --- ---

        next(error); // IMPORTANT: Propagate error to the global error handler in server.js
    }
};

// --- Keep all other controller functions (getConnections, likeConnection, favoriteConnection, deleteConnection) exactly as they were in the previous version ---

/**
 * @desc    Get all connections (feed)
 * @route   GET /api/connections
 * @access  Public
 */
const getConnections = async (req, res, next) => {
    try {
        console.log('[getConnections] Fetching connections...'); // Added basic log
        const connections = await Connection.find({})
            .populate('userRef', 'email _id')
            .populate('movieRef', 'title _id')
            .populate('bookRef', 'title _id')
            .sort({ createdAt: -1 })
            .limit(50);
        console.log(`[getConnections] Found ${connections.length} connections.`); // Added count log
        res.json(connections);
    } catch (error) {
        console.error('[getConnections] Error fetching connections:', error); // Added error log
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
    console.log(`[likeConnection] User ${userId} attempting to like/unlike connection ${connectionId}`); // Basic log

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
            console.log(`[likeConnection] User ${userId} is UNLIKING connection ${connectionId}`);
            updateOperation = { $pull: { likes: userId } };
        } else {
            console.log(`[likeConnection] User ${userId} is LIKING connection ${connectionId}`);
            updateOperation = { $addToSet: { likes: userId } };
            if (!connection.userRef.equals(userId)) {
                notificationCreated = true;
            }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId,
            updateOperation,
            { new: true } // Return the updated document
        ) // Keep population if needed by frontend response, but not strictly necessary for like count usually
         .populate('userRef', 'email _id')
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');

        if (!updatedConnection) {
             res.status(404); throw new Error('Connection not found after update attempt.');
        }
        console.log(`[likeConnection] Connection ${connectionId} updated. Likes count: ${updatedConnection.likes.length}`);

        if (notificationCreated) {
            console.log(`[likeConnection] Attempting to create LIKE notification for recipient ${connection.userRef}`);
            try {
                await Notification.create({
                    recipientRef: connection.userRef,
                    senderRef: userId,
                    type: 'LIKE',
                    connectionRef: connection._id,
                });
                 console.log(`[likeConnection] Notification created successfully.`);
            } catch (notificationError) {
                console.error(`[likeConnection] Failed to create LIKE notification: ${notificationError.message}`);
            }
        }

        res.json(updatedConnection); // Send back updated connection or just relevant part (e.g., likes array)

    } catch (error) {
         console.error(`[likeConnection] Error processing like for connection ${connectionId}:`, error);
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
    console.log(`[favoriteConnection] User ${userId} attempting to favorite/unfavorite connection ${connectionId}`); // Basic log

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
             console.log(`[favoriteConnection] User ${userId} is UNFAVORITING connection ${connectionId}`);
            updateOperation = { $pull: { favorites: userId } };
        } else {
             console.log(`[favoriteConnection] User ${userId} is FAVORITING connection ${connectionId}`);
            updateOperation = { $addToSet: { favorites: userId } };
            if (!connection.userRef.equals(userId)) {
                notificationCreated = true;
            }
        }

        const updatedConnection = await Connection.findByIdAndUpdate(
            connectionId,
            updateOperation,
            { new: true } // Return the updated document
        ) // Keep population if needed
         .populate('userRef', 'email _id')
         .populate('movieRef', 'title _id')
         .populate('bookRef', 'title _id');

         if (!updatedConnection) {
             res.status(404); throw new Error('Connection not found after update attempt.');
        }
        console.log(`[favoriteConnection] Connection ${connectionId} updated. Favorites count: ${updatedConnection.favorites.length}`);


         if (notificationCreated) {
            console.log(`[favoriteConnection] Attempting to create FAVORITE notification for recipient ${connection.userRef}`);
             try {
                 await Notification.create({
                    recipientRef: connection.userRef,
                    senderRef: userId,
                    type: 'FAVORITE',
                    connectionRef: connection._id,
                 });
                 console.log(`[favoriteConnection] Notification created successfully.`);
             } catch (notificationError) {
                 console.error(`[favoriteConnection] Failed to create FAVORITE notification: ${notificationError.message}`);
             }
        }

        res.json(updatedConnection); // Send back updated connection or just relevant part

    } catch (error) {
        console.error(`[favoriteConnection] Error processing favorite for connection ${connectionId}:`, error);
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
    if (!req.user || !req.user._id) { return next(new Error('User not found for delete action.')); }
    const userId = req.user._id;
    console.log(`[deleteConnection] User ${userId} attempting to delete connection ${connectionId}`); // Basic log

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
        console.log(`[deleteConnection] Found connection. Owner: ${connection.userRef}`);


        console.log(`[deleteConnection] Checking ownership (User: ${userId}, Owner: ${connection.userRef})`);
        if (!connection.userRef.equals(userId)) {
            console.warn(`[deleteConnection] Authorization failed. User ${userId} is not owner of connection ${connectionId}.`);
            res.status(403); throw new Error('User not authorized to delete this connection');
        }
        console.log(`[deleteConnection] Ownership verified.`);

        // Delete Images from Cloudinary (Keep existing logic)
        const publicIdsToDelete = [];
        if (connection.moviePosterPublicId) publicIdsToDelete.push(connection.moviePosterPublicId);
        if (connection.bookCoverPublicId) publicIdsToDelete.push(connection.bookCoverPublicId);
        if (connection.screenshotPublicId) publicIdsToDelete.push(connection.screenshotPublicId);

        if (publicIdsToDelete.length > 0) {
            console.log(`[deleteConnection] Attempting to delete ${publicIdsToDelete.length} Cloudinary resource(s): ${publicIdsToDelete.join(', ')}`);
            try {
                const deletionResult = await cloudinary.api.delete_resources(publicIdsToDelete, {
                    type: 'upload', resource_type: 'image'
                });
                console.log('[deleteConnection] Cloudinary deletion API response:', JSON.stringify(deletionResult, null, 2));
                // Log summary based on result (Kept your detailed checks)
                const deletedCount = publicIdsToDelete.reduce((count, id) => (deletionResult.deleted?.[id] === 'deleted' ? count + 1 : count), 0);
                const notFoundCount = publicIdsToDelete.reduce((count, id) => (deletionResult.deleted?.[id] === 'not_found' ? count + 1 : count), 0);
                if (deletedCount > 0) console.log(`[deleteConnection] Successfully deleted ${deletedCount} image(s) from Cloudinary.`);
                if (notFoundCount > 0) console.log(`[deleteConnection] ${notFoundCount} image(s) were already not found on Cloudinary.`);
                if (deletedCount + notFoundCount < publicIdsToDelete.length) console.warn(`[deleteConnection] Cloudinary deletion partially failed or had unexpected results for connection ${connectionId}.`);

            } catch (cloudinaryError) {
                console.error(`[deleteConnection] CRITICAL ERROR deleting images from Cloudinary for connection ${connectionId}:`, cloudinaryError);
                // Decide if you want to stop or continue. Current logic continues.
                // If stopping: return next(new Error('Failed to delete associated images from Cloudinary'));
            }
        } else {
            console.log(`[deleteConnection] No Cloudinary public IDs found for connection ${connectionId}. Skipping Cloudinary deletion.`);
        }

        // Delete Connection from Database
        console.log(`[deleteConnection] Deleting connection document ${connectionId} from database...`);
        await Connection.deleteOne({ _id: connectionId });
        console.log(`[deleteConnection] Connection document ${connectionId} deleted.`);

        // Delete Associated Notifications
        console.log(`[deleteConnection] Deleting associated notifications for connection ${connectionId}...`);
        try {
            const { deletedCount } = await Notification.deleteMany({ connectionRef: connectionId });
            console.log(`[deleteConnection] Deleted ${deletedCount} related notification(s).`);
        } catch (notificationError) {
            console.error(`[deleteConnection] Error deleting associated notifications for connection ${connectionId}: ${notificationError.message}`);
        }

        console.log(`[deleteConnection] Sending success response (200) for connection ${connectionId}.`);
        res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });

    } catch (error) {
        console.error(`[deleteConnection] Error during deletion process for connection ${connectionId}:`, error);
        next(error); // Pass to global error handler
    }
};

module.exports = {
    createConnection,
    getConnections,
    likeConnection,
    favoriteConnection,
    deleteConnection
};