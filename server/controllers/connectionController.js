// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js'; // User model is already imported

// --- Helper Function to process comma-separated strings into arrays ---
const processStringToArray = (inputString) => {
  if (!inputString || typeof inputString !== 'string') {
    return [];
  }
  return inputString.split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
};

// --- UPDATED Helper function to find or create Movie/Book ---
const findOrCreate = async (model, query, data) => {
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true,
  };
  const collation = {locale: 'en', strength: 2};

  const updateData = {};
  for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
          if (Array.isArray(data[key])) {
               updateData[key] = data[key].length > 0 ? data[key] : [];
          } else if (typeof data[key] === 'string' && data[key].trim() === '') {
               updateData[key] = data[key];
          } else {
               updateData[key] = data[key];
          }
      }
  }

  let doc = await model.findOne(query).collation(collation);

  if (doc) {
      let needsUpdate = false;
      for (const key in updateData) {
           if (!(key in doc) || JSON.stringify(doc[key]) !== JSON.stringify(updateData[key])) {
                doc[key] = updateData[key];
                needsUpdate = true;
           }
      }
       if (needsUpdate) {
            doc = await doc.save();
       }
       return doc;
  } else {
      const createData = { ...query, ...updateData };
      return await model.create(createData);
  }
};

/**
 * @desc    Create a new MovieBook connection
 * @route   POST /api/connections
 * @access  Private
 */
export const createConnection = asyncHandler(async (req, res, next) => {
  const {
    movieTitle, movieGenres, movieDirector, movieActors, bookTitle, bookGenres, bookAuthor, context, tags
  } = req.body;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Authentication error: User not found.'); }
  const userId = req.user._id;
  // console.log('[createConnection] Starting process...');
  // console.log('[createConnection] Authenticated User ID:', userId);
  if (!movieTitle || !bookTitle) { res.status(400); throw new Error('Movie title and Book title are required'); }

  const processedTags = processStringToArray(tags);
  const processedMovieGenres = processStringToArray(movieGenres);
  const processedMovieActors = processStringToArray(movieActors);
  const processedBookGenres = processStringToArray(bookGenres);

  const movieData = { title: movieTitle, genres: processedMovieGenres, director: movieDirector?.trim() || undefined, actors: processedMovieActors };
  const bookData = { title: bookTitle, genres: processedBookGenres, author: bookAuthor?.trim() || undefined };
  const movie = await findOrCreate(Movie, { title: movieTitle }, movieData);
  const book = await findOrCreate(Book, { title: bookTitle }, bookData);

  const connectionData = { userRef: userId, movieRef: movie._id, bookRef: book._id, context: context || '', tags: processedTags };
  if (req.files) {
    if (req.files.moviePoster?.[0]) { connectionData.moviePosterUrl = req.files.moviePoster[0].path; connectionData.moviePosterPublicId = req.files.moviePoster[0].filename; }
    if (req.files.bookCover?.[0]) { connectionData.bookCoverUrl = req.files.bookCover[0].path; connectionData.bookCoverPublicId = req.files.bookCover[0].filename; }
    if (req.files.screenshot?.[0]) { connectionData.screenshotUrl = req.files.screenshot[0].path; connectionData.screenshotPublicId = req.files.screenshot[0].filename; }
  }

  const newConnection = await Connection.create(connectionData);
  // console.log('[createConnection] Connection document created. ID:', newConnection._id);
  const populatedConnection = await Connection.findById(newConnection._id).populate('userRef', 'username profileImageUrl _id').populate('movieRef').populate('bookRef');
  if (!populatedConnection) { console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`); res.status(404); throw new Error('Connection created but could not be retrieved for response.'); }
  // console.log('[createConnection] Sending success response (201).');
  res.status(201).json(populatedConnection);
});

/**
 * @desc    Get connections (feed) with filtering and pagination using Aggregation
 * @route   GET /api/connections?tags=...&movieGenre=...&bookAuthor=...&pageNumber=...
 * @access  Public
 */
export const getConnections = asyncHandler(async (req, res, next) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const { tags, movieGenre, director, actor, bookGenre, author } = req.query;
  const matchStage = {};
  if (tags && typeof tags === 'string' && tags.trim() !== '') { const tagsArray = processStringToArray(tags); if (tagsArray.length > 0) { matchStage.tags = { $in: tagsArray }; } }
  if (movieGenre && typeof movieGenre === 'string' && movieGenre.trim() !== '') { matchStage['movieData.genres'] = { $regex: `^${movieGenre.trim()}$`, $options: 'i' }; }
  if (director && typeof director === 'string' && director.trim() !== '') { matchStage['movieData.director'] = { $regex: `^${director.trim()}$`, $options: 'i' }; }
  if (actor && typeof actor === 'string' && actor.trim() !== '') { matchStage['movieData.actors'] = { $regex: `^${actor.trim()}$`, $options: 'i' }; }
  if (bookGenre && typeof bookGenre === 'string' && bookGenre.trim() !== '') { matchStage['bookData.genres'] = { $regex: `^${bookGenre.trim()}$`, $options: 'i' }; }
  if (author && typeof author === 'string' && author.trim() !== '') { matchStage['bookData.author'] = { $regex: `^${author.trim()}$`, $options: 'i' }; }
  const isFilterApplied = Object.keys(matchStage).length > 0;
  const aggregationPipelineBase = [ { $lookup: { from: 'movies', localField: 'movieRef', foreignField: '_id', as: 'movieData' } }, { $unwind: { path: '$movieData', preserveNullAndEmptyArrays: true } }, { $lookup: { from: 'books', localField: 'bookRef', foreignField: '_id', as: 'bookData' } }, { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } }, { $lookup: { from: 'users', localField: 'userRef', foreignField: '_id', as: 'userData' } }, { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }, { $match: matchStage } ];
  const countResult = await Connection.aggregate([...aggregationPipelineBase, { $count: 'totalCount' }]);
  const count = countResult.length > 0 ? countResult[0].totalCount : 0;
  const connections = await Connection.aggregate([ ...aggregationPipelineBase, { $sort: { createdAt: -1 } }, { $skip: pageSize * (page - 1) }, { $limit: pageSize }, { $project: { _id: 1, context: 1, tags: 1, moviePosterUrl: 1, bookCoverUrl: 1, screenshotUrl: 1, likes: 1, favorites: 1, createdAt: 1, updatedAt: 1, userRef: { _id: '$userData._id', username: '$userData.username', profileImageUrl: '$userData.profileImageUrl' }, movieRef: { _id: '$movieData._id', title: '$movieData.title', genres: '$movieData.genres', director: '$movieData.director', actors: '$movieData.actors' }, bookRef: { _id: '$bookData._id', title: '$bookData.title', genres: '$bookData.genres', author: '$bookData.author' } } } ]);
  res.json({ connections, page, pages: Math.ceil(count / pageSize), filterApplied: isFilterApplied, activeFilters: req.query });
});

/**
 * @desc    Get popular tags based on frequency in Connections
 * @route   GET /api/connections/popular-tags
 * @access  Public
 */
export const getPopularTags = asyncHandler(async (req, res) => {
    const tagLimit = 15;
    try {
        const popularTags = await Connection.aggregate([
            { $match: { tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            { $project: { tagLower: { $toLower: '$tags' } } },
            { $group: { _id: '$tagLower', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: tagLimit },
            { $project: { _id: 0, tag: '$_id', count: 1 } }
        ]);
        res.json(popularTags);
    } catch (error) {
        console.error('[getPopularTags] Error fetching popular tags:', error);
        res.status(500);
        throw new Error('Server error fetching popular tags');
    }
});

/** =========================================================================
 *                           LIKE CONNECTION
 *  =========================================================================
 */
export const likeConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id || !req.user.username) { res.status(401); throw new Error('User not found or username missing for like action.'); }
  const userId = req.user._id;
  const username = req.user.username;
  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId);
  if (!connection) { res.status(404); throw new Error('Connection not found'); }
  const alreadyLiked = connection.likes.some(like => like.equals(userId));
  let updateOperation;
  let notificationShouldBeCreated = false;
  let notificationId = null;
  if (alreadyLiked) { updateOperation = { $pull: { likes: userId } }; } else { updateOperation = { $addToSet: { likes: userId } }; if (!connection.userRef.equals(userId)) { notificationShouldBeCreated = true; } }
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true });
  if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found after update attempt.'); }
  if (notificationShouldBeCreated) { try { const notificationMessage = `${username} liked your connection.`; const notification = await Notification.create({ recipientRef: connection.userRef, senderRef: userId, type: 'LIKE', connectionRef: connection._id, message: notificationMessage }); notificationId = notification._id; /* console.log(`[likeConnection] Notification created: ${notificationId}`); */ } catch (notificationError) { console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`); } }
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id).populate('userRef', 'username profileImageUrl _id').populate('movieRef').populate('bookRef');
  res.json({ connection: updatedConnection, notificationId }); // Keep returning notificationId for potential frontend use
});


/** =========================================================================
 *                       FAVORITE CONNECTION (REVISED)
 *  =========================================================================
 */
export const favoriteConnection = asyncHandler(async (req, res, next) => {
  // console.log(`[favoriteConnection] Controller invoked for connection ID: ${req.params.id} by user: ${req.user?._id}`);

  const connectionId = req.params.id;
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('User not found for favorite action.');
  }
  const userId = req.user._id; // User performing the action

  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    res.status(400);
    throw new Error('Invalid Connection ID format');
  }

  // --- Find the connection ---
  const connection = await Connection.findById(connectionId);
  if (!connection) {
    res.status(404);
    throw new Error('Connection not found');
  }
  const connectionCreatorId = connection.userRef; // User who created the connection

  // --- Check if already favorited (on the Connection object) ---
  const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));

  let connectionUpdateOperation;
  let userUpdateOperation;
  let notificationShouldBeCreated = false;

  if (alreadyFavorited) {
    // --- Action: UN-FAVORITE ---
    connectionUpdateOperation = { $pull: { favorites: userId } };
    userUpdateOperation = { $pull: { favorites: connectionId } }; // Remove connection from user's list
    // console.log(`[favoriteConnection] User ${userId} UN-favoriting connection ${connectionId}`);
  } else {
    // --- Action: FAVORITE ---
    connectionUpdateOperation = { $addToSet: { favorites: userId } };
    userUpdateOperation = { $addToSet: { favorites: connectionId } }; // Add connection to user's list
    // console.log(`[favoriteConnection] User ${userId} FAVORITING connection ${connectionId}`);
    // Only create notification if someone ELSE favorites the connection
    if (!connectionCreatorId.equals(userId)) {
      notificationShouldBeCreated = true;
    }
  }

  // --- Update the Connection document ---
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, connectionUpdateOperation, { new: true });
  if (!updatedConnectionRaw) {
    res.status(404);
    throw new Error('Connection not found during update attempt.');
  }

  // --- Update the User document (of the user performing the action) ---
  try {
    await User.findByIdAndUpdate(userId, userUpdateOperation);
    // console.log(`[favoriteConnection] User ${userId} favorites list updated successfully.`);
  } catch (userUpdateError) {
    console.error(`[favoriteConnection] FAILED to update user ${userId} favorites list:`, userUpdateError);
    // Consider potential rollback or notification here if critical
  }

  // --- Create Notification (if applicable) ---
  if (notificationShouldBeCreated) {
    try {
      const favoriterUsername = req.user.username || 'Someone'; // Fallback just in case
      const notificationMessage = `${favoriterUsername} favorited your connection.`;
      await Notification.create({
        recipientRef: connectionCreatorId, // Send to the connection owner
        senderRef: userId,                 // Sender is the user who favorited
        type: 'FAVORITE',                  // Use a distinct type
        connectionRef: connection._id,
        message: notificationMessage
      });
      // console.log(`[favoriteConnection] Notification created for user ${connectionCreatorId}`);
    } catch (notificationError) {
      console.error(`[favoriteConnection] Failed notification creation for FAVORITE: ${notificationError.message}`);
    }
  }

  // --- Populate and Send Response ---
   const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
     .populate('userRef', 'username profileImageUrl _id')
     .populate('movieRef')
     .populate('bookRef');

   if (!updatedConnection) {
     console.error(`[favoriteConnection] CRITICAL: Failed to populate connection ${connectionId} after update.`);
     res.status(500);
     throw new Error('Failed to retrieve updated connection details.');
   }

   // console.log(`[favoriteConnection] Success for connection ${connectionId}. Connection favorites count: ${updatedConnection.favorites.length}`);
   res.json(updatedConnection); // Return updated connection (client uses updateUserFavorites)
});
/** =========================================================================
 *                      END FAVORITE CONNECTION
 *  =========================================================================
 */


/**
 * @desc    Delete a connection
 * @route   DELETE /api/connections/:id
 * @access  Private (Owner only)
 */
export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for delete action.'); }
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }

    const connection = await Connection.findById(connectionId);
    if (!connection) { res.status(404); throw new Error('Connection not found'); }

    // --- Authorization Check: Only the owner can delete ---
    if (!connection.userRef.equals(userId)) { res.status(403); throw new Error('User not authorized to delete this connection'); }

    // --- Clean up associated data ---
    // 1. Cloudinary Images
    const publicIdsToDelete = [ connection.moviePosterPublicId, connection.bookCoverPublicId, connection.screenshotPublicId ].filter(Boolean);
    if (publicIdsToDelete.length > 0) {
        try {
            await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' });
            // console.log('[deleteConnection] Cloudinary deletion request finished.');
        } catch (cloudinaryError) {
            console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError);
        }
    }

    // 2. Remove connection reference from all users' favorites lists
    try {
        const updateResult = await User.updateMany(
            { favorites: connectionId },
            { $pull: { favorites: connectionId } }
        );
        // console.log(`[deleteConnection] Removed connection ${connectionId} from ${updateResult.modifiedCount} users' favorites lists.`);
    } catch (userUpdateError) {
        console.error(`[deleteConnection] WARNING: Failed to remove connection ${connectionId} from users' favorites lists:`, userUpdateError);
    }

    // 3. Delete Comments
    try {
        await Comment.deleteMany({ connection: connectionId });
        // console.log(`[deleteConnection] Deleted comments for connection ${connectionId}.`);
    } catch(commentDeleteError) {
        console.error(`[deleteConnection] WARNING: Failed to delete comments for connection ${connectionId}:`, commentDeleteError);
    }

    // 4. Delete Notifications
    try {
        await Notification.deleteMany({ connectionRef: connectionId });
        // console.log(`[deleteConnection] Deleted notifications for connection ${connectionId}.`);
    } catch (notificationDeleteError) {
        console.error(`[deleteConnection] WARNING: Failed to delete notifications for connection ${connectionId}:`, notificationDeleteError);
    }

    // 5. Delete the connection itself
    await Connection.deleteOne({ _id: connectionId });

    // console.log(`[deleteConnection] Sending success (200) for ${connectionId}.`);
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});


/**
 * @desc    Get all connections created by a specific user
 * @route   GET /api/connections/user/:userId
 * @access  Public
 */
export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400);
      throw new Error('Invalid User ID format');
  }
  // TODO: Consider adding pagination if a user can have many connections
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profileImageUrl _id')
    .populate('movieRef')
    .populate('bookRef')
    .sort({ createdAt: -1 }); // Sort by newest first

  res.json(connections || []); // Return empty array if no connections found
});

// --- NEW FUNCTION ---
/**
 * @desc    Get multiple connections by their IDs (for Favorites view)
 * @route   POST /api/connections/batch
 * @access  Private (Requires logged-in user to provide IDs)
 */
export const getConnectionsByIds = asyncHandler(async (req, res) => {
    console.log('[getConnectionsByIds] Request received. Body:', req.body);

    // 1. Extract and Validate Input
    const { connectionIds } = req.body;
    if (!Array.isArray(connectionIds)) {
        res.status(400);
        throw new Error('Request body must contain an array named "connectionIds".');
    }
    if (connectionIds.length === 0) {
        console.log('[getConnectionsByIds] Received empty connectionIds array. Returning empty list.');
        return res.json([]); // Return empty array, not an error
    }

    // 2. Filter for Valid ObjectIds
    const validConnectionIds = connectionIds.filter(id => {
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (!isValid) {
            console.warn(`[getConnectionsByIds] Filtering out invalid ObjectId: ${id}`);
        }
        return isValid;
    });

    if (validConnectionIds.length === 0) {
        console.log('[getConnectionsByIds] No valid ObjectIds found after filtering. Returning empty list.');
        return res.json([]); // Return empty array if no valid IDs remain
    }

    console.log(`[getConnectionsByIds] Fetching ${validConnectionIds.length} valid connection IDs.`);

    // 3. Fetch Connections from DB
    const connections = await Connection.find({ _id: { $in: validConnectionIds } })
        .populate('userRef', 'username profileImageUrl _id') // Populate necessary fields
        .populate('movieRef')
        .populate('bookRef')
        .sort({ createdAt: -1 }); // Optional: sort results if desired

    console.log(`[getConnectionsByIds] Found ${connections.length} connections.`);

    // 4. Return Results
    res.json(connections || []); // Ensure an array is always returned
});
// --- END NEW FUNCTION ---