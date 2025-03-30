// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler'; // Assuming you use this for async error handling
import mongoose from 'mongoose';
import Connection from '../models/Connection.js'; // Use import, add .js extension
import Movie from '../models/Movie.js';         // Use import, add .js extension
import Book from '../models/Book.js';           // Use import, add .js extension
import Notification from '../models/Notification.js'; // Use import, add .js extension
import cloudinary from '../config/cloudinary.js'; // Use import, add .js extension

// Helper function to find or create Movie/Book atomically (remains the same)
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
// Use named export and wrap with asyncHandler if used elsewhere
export const createConnection = asyncHandler(async (req, res, next) => {
    const { movieTitle, bookTitle, context } = req.body;
    if (!req.user || !req.user._id) {
        console.error('[createConnection] Error: req.user is not defined or missing _id.');
        res.status(401); // Use 401 for Unauthorized
        throw new Error('Authentication error: User not found.');
    }
    const userId = req.user._id;

    const connectionData = {};

    console.log('[createConnection] Starting process...');
    console.log('[createConnection] Request Body (Text Fields):', JSON.stringify(req.body, null, 2));
    console.log('[createConnection] Authenticated User ID:', userId);
    console.log('[createConnection] Inspecting req.files before processing:', req.files); // Keep the log

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
    console.log('[createConnection] Processing uploaded files (if req.files exists)...');
    if (req.files) {
        console.log('[createConnection] req.files object is present.');
        if (req.files.moviePoster && req.files.moviePoster[0]) {
            console.log('[createConnection] Found moviePoster file data.');
            connectionData.moviePosterUrl = req.files.moviePoster[0].path;
            connectionData.moviePosterPublicId = req.files.moviePoster[0].filename;
        } else {
             console.log('[createConnection] No moviePoster file data found in req.files.');
        }
        if (req.files.bookCover && req.files.bookCover[0]) {
            console.log('[createConnection] Found bookCover file data.');
            connectionData.bookCoverUrl = req.files.bookCover[0].path;
            connectionData.bookCoverPublicId = req.files.bookCover[0].filename;
        } else {
             console.log('[createConnection] No bookCover file data found in req.files.');
        }
        if (req.files.screenshot && req.files.screenshot[0]) {
            console.log('[createConnection] Found screenshot file data.');
            connectionData.screenshotUrl = req.files.screenshot[0].path;
            connectionData.screenshotPublicId = req.files.screenshot[0].filename;
        } else {
             console.log('[createConnection] No screenshot file data found in req.files.');
        }
    } else {
        console.log('[createConnection] req.files object is NOT present.');
    }

    // Create the connection
    console.log('[createConnection] Attempting Connection.create with data:', connectionData);
    const connection = await Connection.create(connectionData);
    console.log('[createConnection] Connection document created. ID:', connection._id);

    // Populate and send response
    console.log('[createConnection] Attempting to populate created connection...');
    // NOTE: No need to findById again after create, Mongoose returns the created doc.
    // We just need to populate the refs on the 'connection' object we already have.
    // However, populating immediately after create can sometimes be less direct.
    // Sticking with findById for robust population:
     const populatedConnection = await Connection.findById(connection._id)
        .populate('userRef', 'username _id')
        .populate('movieRef', 'title _id')
        .populate('bookRef', 'title _id');
    console.log('[createConnection] Population complete.');

    if (!populatedConnection) {
        console.error(`[createConnection] CRITICAL: Connection created (ID: ${connection._id}) but failed to populate!`);
        res.status(404); throw new Error('Connection created but could not be retrieved for response.');
    }

    console.log('[createConnection] Sending success response (201).');
    res.status(201).json(populatedConnection);

}); // End asyncHandler wrapper

/**
 * @desc    Get all connections (feed)
 * @route   GET /api/connections
 * @access  Public
 */
// Use named export and wrap with asyncHandler
export const getConnections = asyncHandler(async (req, res, next) => {
    console.log('[getConnections] Fetching connections...');
    // --- Pagination Logic START (based on original project summary) ---
    const pageSize = 10; // Or get from env/config
    const page = Number(req.query.pageNumber) || 1;

    const count = await Connection.countDocuments({}); // Get total count for pagination
    const connections = await Connection.find({})
        .populate('userRef', 'username profileImageUrl _id') // Include profile image URL if needed later
        .populate('movieRef', 'title _id')
        .populate('bookRef', 'title _id')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
    // --- Pagination Logic END ---

    console.log(`[getConnections] Found ${connections.length} connections for page ${page}. Total count: ${count}`);
    if (connections.length > 0) {
        console.log('[getConnections] Example connection data being sent (first one):', JSON.stringify(connections[0], null, 2));
    }

    // --- Send paginated response object ---
    res.json({ connections, page, pages: Math.ceil(count / pageSize) });
}); // End asyncHandler wrapper


/**
 * @desc    Like or unlike a connection
 * @route   POST /api/connections/:id/like
 * @access  Private
 */
// Use named export and wrap with asyncHandler
export const likeConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for like action.'); }
    const userId = req.user._id;

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
    let notificationId = null; // Initialize notification ID

    if (alreadyLiked) {
        updateOperation = { $pull: { likes: userId } };
    } else {
        updateOperation = { $addToSet: { likes: userId } };
        // Only create notification if someone ELSE likes it
        if (!connection.userRef.equals(userId)) { notificationCreated = true; }
    }

    const updatedConnectionRaw = await Connection.findByIdAndUpdate(
        connectionId, updateOperation, { new: true } // Get the updated document
    );

     if (!updatedConnectionRaw) {
         res.status(404); throw new Error('Connection not found after update attempt.');
     }

    if (notificationCreated) {
        console.log(`[likeConnection] Creating LIKE notification for ${connection.userRef}`);
        try {
            const notification = await Notification.create({
                recipientRef: connection.userRef, // The owner of the connection
                senderRef: userId, // The user who liked it
                type: 'LIKE',
                connectionRef: connection._id,
            });
            notificationId = notification._id; // Store the ID
            console.log(`[likeConnection] Notification created: ${notificationId}`);
        } catch (notificationError) {
            console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`);
            // Don't fail the whole request, just log the error
        }
    }

    // Populate the updated connection before sending
    const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
       .populate('userRef', 'username profileImageUrl _id')
       .populate('movieRef', 'title _id')
       .populate('bookRef', 'title _id');

     console.log(`[likeConnection] Updated. Likes: ${updatedConnection.likes.length}`);

    // Send back the updated connection AND the notification ID (if created)
    res.json({ connection: updatedConnection, notificationId });

}); // End asyncHandler wrapper

/**
 * @desc    Favorite or unfavorite a connection
 * @route   POST /api/connections/:id/favorite
 * @access  Private
 */
// Use named export and wrap with asyncHandler
export const favoriteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for favorite action.'); }
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400); throw new Error('Invalid Connection ID format');
    }
    const connection = await Connection.findById(connectionId);
    if (!connection) {
        res.status(404); throw new Error('Connection not found');
    }

    const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
    let updateOperation;
    // Note: No notification for favorites in the original spec, but could add similar logic to likes if desired

    if (alreadyFavorited) {
        updateOperation = { $pull: { favorites: userId } };
    } else {
        updateOperation = { $addToSet: { favorites: userId } };
    }

    const updatedConnectionRaw = await Connection.findByIdAndUpdate(
        connectionId, updateOperation, { new: true }
    );

     if (!updatedConnectionRaw) {
         res.status(404); throw new Error('Connection not found after update attempt.');
     }

    // Populate before sending
     const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
       .populate('userRef', 'username profileImageUrl _id')
       .populate('movieRef', 'title _id')
       .populate('bookRef', 'title _id');

     console.log(`[favoriteConnection] Updated. Favorites: ${updatedConnection.favorites.length}`);
    res.json(updatedConnection); // Send populated connection

}); // End asyncHandler wrapper

/**
 * @desc    Delete a connection
 * @route   DELETE /api/connections/:id
 * @access  Private (Owner only)
 */
// Use named export and wrap with asyncHandler
export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for delete action.'); }
    const userId = req.user._id;

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
            // Make sure cloudinary SDK v2 is used if using await directly
            await cloudinary.api.delete_resources(publicIdsToDelete, {
                type: 'upload', resource_type: 'image'
            });
            console.log('[deleteConnection] Cloudinary deletion request finished.'); // Changed log slightly
        } catch (cloudinaryError) {
            console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError);
            // Decide if stop or continue. Continuing... maybe log to a monitoring service
        }
    }

    // Delete Connection from Database
    console.log(`[deleteConnection] Deleting connection doc ${connectionId}...`);
    await Connection.deleteOne({ _id: connectionId }); // Use deleteOne
    console.log(`[deleteConnection] Connection doc ${connectionId} deleted.`);

    // Delete Associated Comments (if comments exist)
    // Check if Comment model is imported and available
    // console.log(`[deleteConnection] Deleting associated comments...`);
    // try {
    //     const Comment = mongoose.model('Comment'); // Or import Comment model
    //     await Comment.deleteMany({ connectionRef: connectionId });
    // } catch (commentError) {
    //     console.error(`[deleteConnection] Error deleting comments: ${commentError.message}`);
    // }

    // Delete Associated Notifications
    console.log(`[deleteConnection] Deleting associated notifications...`);
    try {
        await Notification.deleteMany({ connectionRef: connectionId });
        console.log(`[deleteConnection] Associated notifications deleted.`);
    } catch (notificationError) {
        console.error(`[deleteConnection] Error deleting notifications: ${notificationError.message}`);
    }

    console.log(`[deleteConnection] Sending success (200) for ${connectionId}.`);
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });

}); // End asyncHandler wrapper