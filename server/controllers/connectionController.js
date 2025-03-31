// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js'; // Ensure Comment model is imported for delete cascade
import cloudinary from '../config/cloudinary.js';

// Helper function to find or create Movie/Book atomically (remains the same)
const findOrCreate = async (model, query, data) => {
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  };
  const collation = {locale: 'en', strength: 2};
  return await model
    .findOneAndUpdate (query, data, options)
    .collation (collation);
};

/**
 * @desc    Create a new MovieBook connection
 * @route   POST /api/connections
 * @access  Private
 */
export const createConnection = asyncHandler (async (req, res, next) => {
  // Destructure known fields, including the new 'tags' field
  const {movieTitle, bookTitle, context, tags} = req.body;

  if (!req.user || !req.user._id) {
    console.error (
      '[createConnection] Error: req.user is not defined or missing _id.'
    );
    res.status (401);
    throw new Error ('Authentication error: User not found.');
  }
  const userId = req.user._id;

  const connectionData = {};

  console.log ('[createConnection] Starting process...');
  // Log tags as received
  console.log (
    '[createConnection] Request Body (Text Fields):',
    JSON.stringify ({movieTitle, bookTitle, context, tags}, null, 2)
  );
  console.log ('[createConnection] Authenticated User ID:', userId);
  console.log (
    '[createConnection] Inspecting req.files before processing:',
    req.files
  );

  if (!movieTitle || !bookTitle) {
    res.status (400);
    throw new Error ('Movie title and Book title are required');
  }

  // --- Process Tags ---
  let processedTags = [];
  if (tags && typeof tags === 'string') {
    // Split comma-separated string, trim whitespace, filter empty strings
    processedTags = tags
      .split (',')
      .map (tag => tag.trim ())
      .filter (tag => tag.length > 0);
    console.log (
      '[createConnection] Processed tags from string:',
      processedTags
    );
  } else if (Array.isArray (tags)) {
    // If it's already an array, just trim and filter
    processedTags = tags
      .map (tag => (typeof tag === 'string' ? tag.trim () : ''))
      .filter (tag => tag.length > 0);
    console.log (
      '[createConnection] Processed tags from array:',
      processedTags
    );
  } else if (tags) {
    console.warn (
      '[createConnection] Received tags in unexpected format:',
      tags
    );
  }
  // --- End Process Tags ---

  // Find or create Movie and Book
  console.log ('[createConnection] Attempting findOrCreate Movie:', movieTitle);
  const movie = await findOrCreate (
    Movie,
    {title: movieTitle},
    {title: movieTitle}
  );
  console.log ('[createConnection] Attempting findOrCreate Book:', bookTitle);
  const book = await findOrCreate (
    Book,
    {title: bookTitle},
    {title: bookTitle}
  );

  // Prepare core connection data
  connectionData.userRef = userId;
  connectionData.movieRef = movie._id;
  connectionData.bookRef = book._id;
  connectionData.context = context || '';
  connectionData.tags = processedTags; // Add the processed tags

  // Process Uploaded Files from Cloudinary
  console.log (
    '[createConnection] Processing uploaded files (if req.files exists)...'
  );
  if (req.files) {
    console.log ('[createConnection] req.files object is present.');
    if (req.files.moviePoster && req.files.moviePoster[0]) {
      console.log ('[createConnection] Found moviePoster file data.');
      connectionData.moviePosterUrl = req.files.moviePoster[0].path;
      connectionData.moviePosterPublicId = req.files.moviePoster[0].filename;
    } else {
      console.log (
        '[createConnection] No moviePoster file data found in req.files.'
      );
    }
    if (req.files.bookCover && req.files.bookCover[0]) {
      console.log ('[createConnection] Found bookCover file data.');
      connectionData.bookCoverUrl = req.files.bookCover[0].path;
      connectionData.bookCoverPublicId = req.files.bookCover[0].filename;
    } else {
      console.log (
        '[createConnection] No bookCover file data found in req.files.'
      );
    }
    if (req.files.screenshot && req.files.screenshot[0]) {
      console.log ('[createConnection] Found screenshot file data.');
      connectionData.screenshotUrl = req.files.screenshot[0].path;
      connectionData.screenshotPublicId = req.files.screenshot[0].filename;
    } else {
      console.log (
        '[createConnection] No screenshot file data found in req.files.'
      );
    }
  } else {
    console.log ('[createConnection] req.files object is NOT present.');
  }

  // Create the connection
  console.log (
    '[createConnection] Attempting Connection.create with data:',
    connectionData
  );
  const connection = await Connection.create (connectionData);
  console.log (
    '[createConnection] Connection document created. ID:',
    connection._id
  );

  // Populate and send response
  console.log (
    '[createConnection] Attempting to populate created connection...'
  );
  const populatedConnection = await Connection.findById (connection._id)
    .populate ('userRef', 'username profileImageUrl _id') // Added profileImageUrl here too for consistency
    .populate ('movieRef', 'title _id')
    .populate ('bookRef', 'title _id');
  console.log ('[createConnection] Population complete.');

  if (!populatedConnection) {
    console.error (
      `[createConnection] CRITICAL: Connection created (ID: ${connection._id}) but failed to populate!`
    );
    res.status (404);
    throw new Error (
      'Connection created but could not be retrieved for response.'
    );
  }

  console.log ('[createConnection] Sending success response (201).');
  res.status (201).json (populatedConnection);
}); // End asyncHandler wrapper

/**
 * @desc    Get all connections (feed) with optional tag filtering
 * @route   GET /api/connections?tags=tag1,tag2&pageNumber=1
 * @access  Public
 */
export const getConnections = asyncHandler (async (req, res, next) => {
  console.log ('[getConnections] Fetching connections...');
  const pageSize = 10;
  const page = Number (req.query.pageNumber) || 1;
  const tagsQuery = req.query.tags; // Get tags from query string (e.g., "dystopian,sci-fi")

  // --- Build Filter Object ---
  const filter = {}; // Start with an empty filter

  if (tagsQuery && typeof tagsQuery === 'string' && tagsQuery.trim () !== '') {
    const tagsArray = tagsQuery
      .split (',')
      .map (tag => tag.trim ())
      .filter (tag => tag.length > 0);
    if (tagsArray.length > 0) {
      // Add tag filter: match connections containing ANY of the specified tags
      filter.tags = {$in: tagsArray};
      console.log (
        `[getConnections] Filtering by tags: ${tagsArray.join (', ')}`
      );
    }
  } else {
    console.log ('[getConnections] No tag filter applied.');
  }
  // --- End Build Filter Object ---

  console.log ('[getConnections] Final filter object:', filter);

  // --- Database Query with Filter and Pagination ---
  const count = await Connection.countDocuments (filter); // Count documents matching the filter
  const connections = await Connection.find (filter) // Find documents matching the filter
    .populate ('userRef', 'username profileImageUrl _id')
    .populate ('movieRef', 'title _id')
    .populate ('bookRef', 'title _id')
    .sort ({createdAt: -1})
    .limit (pageSize)
    .skip (pageSize * (page - 1));
  // --- End Database Query ---

  console.log (
    `[getConnections] Found ${connections.length} connections for page ${page}. Total matching count: ${count}`
  );
  if (connections.length > 0 && page === 1) {
    // Only log example for the first page of results
    console.log (
      '[getConnections] Example connection data being sent (first one):',
      JSON.stringify (connections[0], null, 2)
    );
  }

  // --- Send paginated response object ---
  res.json ({
    connections,
    page,
    pages: Math.ceil (count / pageSize),
    filterApplied: Object.keys (filter).length > 0, // Indicate if a filter was used
    activeFilters: filter, // Send back active filters (useful for frontend state)
  });
}); // End asyncHandler wrapper

/**
 * @desc    Like or unlike a connection
 * @route   POST /api/connections/:id/like
 * @access  Private
 */
export const likeConnection = asyncHandler (async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) {
    res.status (401);
    throw new Error ('User not found for like action.');
  }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    res.status (400);
    throw new Error ('Invalid Connection ID format');
  }
  const connection = await Connection.findById (connectionId);
  if (!connection) {
    res.status (404);
    throw new Error ('Connection not found');
  }

  const alreadyLiked = connection.likes.some (like => like.equals (userId));
  let updateOperation;
  let notificationCreated = false;
  let notificationId = null;

  if (alreadyLiked) {
    updateOperation = {$pull: {likes: userId}};
  } else {
    updateOperation = {$addToSet: {likes: userId}};
    if (!connection.userRef.equals (userId)) {
      notificationCreated = true;
    }
  }

  const updatedConnectionRaw = await Connection.findByIdAndUpdate (
    connectionId,
    updateOperation,
    {new: true}
  );

  if (!updatedConnectionRaw) {
    res.status (404);
    throw new Error ('Connection not found after update attempt.');
  }

  if (notificationCreated) {
    console.log (
      `[likeConnection] Creating LIKE notification for ${connection.userRef}`
    );
    try {
      const notification = await Notification.create ({
        recipientRef: connection.userRef,
        senderRef: userId,
        type: 'LIKE',
        connectionRef: connection._id,
      });
      notificationId = notification._id;
      console.log (`[likeConnection] Notification created: ${notificationId}`);
    } catch (notificationError) {
      console.error (
        `[likeConnection] Failed notification creation: ${notificationError.message}`
      );
    }
  }

  const updatedConnection = await Connection.findById (updatedConnectionRaw._id)
    .populate ('userRef', 'username profileImageUrl _id')
    .populate ('movieRef', 'title _id')
    .populate ('bookRef', 'title _id');

  console.log (
    `[likeConnection] Updated. Likes: ${updatedConnection.likes.length}`
  );
  res.json ({connection: updatedConnection, notificationId});
}); // End asyncHandler wrapper

/**
 * @desc    Favorite or unfavorite a connection
 * @route   POST /api/connections/:id/favorite
 * @access  Private
 */
export const favoriteConnection = asyncHandler (async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) {
    res.status (401);
    throw new Error ('User not found for favorite action.');
  }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    res.status (400);
    throw new Error ('Invalid Connection ID format');
  }
  const connection = await Connection.findById (connectionId);
  if (!connection) {
    res.status (404);
    throw new Error ('Connection not found');
  }

  const alreadyFavorited = connection.favorites.some (fav =>
    fav.equals (userId)
  );
  let updateOperation;

  if (alreadyFavorited) {
    updateOperation = {$pull: {favorites: userId}};
  } else {
    updateOperation = {$addToSet: {favorites: userId}};
  }

  const updatedConnectionRaw = await Connection.findByIdAndUpdate (
    connectionId,
    updateOperation,
    {new: true}
  );

  if (!updatedConnectionRaw) {
    res.status (404);
    throw new Error ('Connection not found after update attempt.');
  }

  const updatedConnection = await Connection.findById (updatedConnectionRaw._id)
    .populate ('userRef', 'username profileImageUrl _id')
    .populate ('movieRef', 'title _id')
    .populate ('bookRef', 'title _id');

  console.log (
    `[favoriteConnection] Updated. Favorites: ${updatedConnection.favorites.length}`
  );
  res.json (updatedConnection);
}); // End asyncHandler wrapper

/**
 * @desc    Delete a connection
 * @route   DELETE /api/connections/:id
 * @access  Private (Owner only)
 */
export const deleteConnection = asyncHandler (async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) {
    res.status (401);
    throw new Error ('User not found for delete action.');
  }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    res.status (400);
    throw new Error ('Invalid Connection ID format');
  }

  console.log (`[deleteConnection] Finding connection ${connectionId}...`);
  const connection = await Connection.findById (connectionId);
  if (!connection) {
    console.log (`[deleteConnection] Connection ${connectionId} not found.`);
    res.status (404);
    throw new Error ('Connection not found');
  }

  console.log (`[deleteConnection] Checking ownership...`);
  if (!connection.userRef.equals (userId)) {
    console.warn (
      `[deleteConnection] Auth failed. User ${userId} != owner ${connection.userRef}.`
    );
    res.status (403);
    throw new Error ('User not authorized to delete this connection');
  }
  console.log (`[deleteConnection] Ownership verified.`);

  // Delete Images from Cloudinary
  const publicIdsToDelete = [
    connection.moviePosterPublicId,
    connection.bookCoverPublicId,
    connection.screenshotPublicId,
  ].filter (Boolean);

  if (publicIdsToDelete.length > 0) {
    console.log (
      `[deleteConnection] Deleting ${publicIdsToDelete.length} Cloudinary resource(s)...`
    );
    try {
      await cloudinary.api.delete_resources (publicIdsToDelete, {
        type: 'upload',
        resource_type: 'image',
      });
      console.log ('[deleteConnection] Cloudinary deletion request finished.');
    } catch (cloudinaryError) {
      console.error (
        `[deleteConnection] WARNING: Error deleting Cloudinary images:`,
        cloudinaryError
      );
    }
  }

  // Delete Connection from Database
  console.log (`[deleteConnection] Deleting connection doc ${connectionId}...`);
  await Connection.deleteOne ({_id: connectionId});
  console.log (`[deleteConnection] Connection doc ${connectionId} deleted.`);

  // Delete Associated Comments
  console.log (
    `[deleteConnection] Deleting associated comments for connection ${connectionId}...`
  );
  try {
    const commentDeletionResult = await Comment.deleteMany ({
      connectionRef: connectionId,
    });
    console.log (
      `[deleteConnection] Deleted ${commentDeletionResult.deletedCount} associated comments.`
    );
  } catch (commentError) {
    console.error (
      `[deleteConnection] Error deleting comments: ${commentError.message}`
    );
  }

  // Delete Associated Notifications
  console.log (
    `[deleteConnection] Deleting associated notifications for connection ${connectionId}...`
  );
  try {
    const notificationDeletionResult = await Notification.deleteMany ({
      connectionRef: connectionId,
    });
    console.log (
      `[deleteConnection] Deleted ${notificationDeletionResult.deletedCount} associated notifications.`
    );
  } catch (notificationError) {
    console.error (
      `[deleteConnection] Error deleting notifications: ${notificationError.message}`
    );
  }

  console.log (`[deleteConnection] Sending success (200) for ${connectionId}.`);
  res
    .status (200)
    .json ({
      message: 'Connection deleted successfully',
      connectionId: connectionId,
    });
}); // End asyncHandler wrapper

// Add other controllers if they exist (getConnectionsByUser, getConnectionById etc.)
// Ensure they also handle population or potential filtering as needed.
// We haven't added specific functions like getConnectionById yet, but they would follow a similar pattern.

// --- Placeholder for get connection by ID (not implemented yet but good practice) ---
// /**
//  * @desc    Get a single connection by ID
//  * @route   GET /api/connections/:id
//  * @access  Public
//  */
// export const getConnectionById = asyncHandler(async (req, res) => {
//     const connectionId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(connectionId)) {
//         res.status(400); throw new Error('Invalid Connection ID format');
//     }
//
//     const connection = await Connection.findById(connectionId)
//         .populate('userRef', 'username profileImageUrl _id')
//         .populate('movieRef', 'title _id')
//         .populate('bookRef', 'title _id');
//
//     if (connection) {
//         res.json(connection);
//     } else {
//         res.status(404);
//         throw new Error('Connection not found');
//     }
// });

// --- Placeholder for get connections by user ID (Update needed if filtering required there too) ---
/**
 * @desc    Get all connections created by a specific user
 * @route   GET /api/users/:userId/connections
 * @access  Public
 */
export const getConnectionsByUserId = asyncHandler (async (req, res) => {
  const targetUserId = req.params.userId;

  // TODO: Add pagination similar to getConnections?
  // TODO: Add filtering similar to getConnections if needed on profile pages?

  if (!mongoose.Types.ObjectId.isValid (targetUserId)) {
    res.status (400);
    throw new Error ('Invalid User ID format');
  }

  const connections = await Connection.find ({userRef: targetUserId})
    .populate ('userRef', 'username profileImageUrl _id') // Populate self, might seem redundant but good practice
    .populate ('movieRef', 'title _id')
    .populate ('bookRef', 'title _id')
    .sort ({createdAt: -1}); // Sort by newest first

  if (connections) {
    res.json (connections);
  } else {
    // Technically find returns [] not null, so this else might not be hit
    // But good practice to handle potential issues or empty results explicitly if desired
    res.json ([]); // Send empty array if no connections found
  }
});
