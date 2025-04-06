// server/controllers/connectionController.js (UPDATED)
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js'; // Make sure Movie model has posterPath/posterPublicId fields
import Book from '../models/Book.js'; // Make sure Book model has coverPath/coverPublicId fields if needed
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';

// --- Helper Function to process comma-separated strings into arrays ---
const processStringToArray = (inputString) => {
  if (!inputString || typeof inputString !== 'string') {
    return [];
  }
  return inputString.split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
};

// --- Helper function to find or create Movie/Book ---
// This function now attempts to merge provided data with existing data
// Needs careful review if you want specific behaviour like "don't overwrite existing poster"
const findOrCreate = async (model, query, data) => {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };
    const collation = { locale: 'en', strength: 2 }; // Case-insensitive query for title

    // Prepare the data we intend to potentially set or update
    const updateData = {};
    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) { // Exclude null/undefined
            if (Array.isArray(data[key])) {
                // Keep empty arrays if provided explicitly, otherwise fallback to schema default
                 updateData[key] = data[key]; // Allow empty arrays from input
            } else if (typeof data[key] === 'string') {
                 // Keep empty strings if provided explicitly
                 updateData[key] = data[key];
            } else {
                 updateData[key] = data[key];
            }
        }
    }

    // console.log(`[findOrCreate] model: ${model.modelName}, query: ${JSON.stringify(query)}, intended updateData: ${JSON.stringify(updateData)}`);

    let doc = await model.findOne(query).collation(collation);

    if (doc) {
        // Document exists, check if update is needed
        // console.log(`[findOrCreate] Found existing doc: ${doc._id}`);
        let needsUpdate = false;
        for (const key in updateData) {
            // Simple comparison: Update if key is missing or value differs
            // This logic WILL overwrite existing posters/data if new data is provided in `updateData`.
            // Add specific logic here if you want to prevent overwriting certain fields (e.g., posterPath)
            if (key === 'posterPath' && doc.posterPath && updateData.posterPath) {
                 // Example: Prevent overwriting existing poster
                 // console.log(`[findOrCreate] Existing poster found (${doc.posterPath}). Not overwriting with ${updateData.posterPath}.`);
                 continue; // Skip updating this field
             }
             // Add similar logic for book cover path if needed

            if (!(key in doc) || JSON.stringify(doc[key]) !== JSON.stringify(updateData[key])) {
                // console.log(`[findOrCreate] Updating field '${key}' from '${JSON.stringify(doc[key])}' to '${JSON.stringify(updateData[key])}'`);
                doc[key] = updateData[key];
                needsUpdate = true;
            }
        }
        if (needsUpdate) {
            // console.log(`[findOrCreate] Saving updated doc: ${doc._id}`);
            doc = await doc.save();
        }
        return doc;
    } else {
        // Document doesn't exist, create it with merged query and data
        // console.log(`[findOrCreate] Creating new doc.`);
        const createData = { ...query, ...updateData }; // Combine query (e.g., title) with the rest of the data
        return await model.create(createData);
    }
};


/**
 * @desc    Create a new MovieBook connection
 * @route   POST /api/connections
 * @access  Private
 */
export const createConnection = asyncHandler(async (req, res, next) => {
  // --- Extract data from request body ---
  // Add any other fields coming from your form (e.g., movieYear, synopsis etc.)
  const {
    movieTitle, movieGenres, movieDirector, movieActors, movieYear, movieSynopsis,
    bookTitle, bookGenres, bookAuthor, /* bookIsbn, bookSynopsis, bookCoverSourceUrl, etc. */
    context, tags
  } = req.body;

  // --- Validate User and Required Fields ---
  if (!req.user || !req.user._id) {
      res.status(401);
      throw new Error('Authentication error: User not found.');
  }
  const userId = req.user._id;
  if (!movieTitle || !bookTitle) {
      res.status(400);
      throw new Error('Movie title and Book title are required');
  }

  // --- Process Input Data (e.g., string arrays) ---
  const processedTags = processStringToArray(tags);
  const processedMovieGenres = processStringToArray(movieGenres);
  const processedMovieActors = processStringToArray(movieActors);
  const processedBookGenres = processStringToArray(bookGenres);

  // --- Prepare initial Movie and Book data objects (without images first) ---
  const movieData = {
      title: movieTitle,
      genres: processedMovieGenres,
      director: movieDirector?.trim() || undefined,
      actors: processedMovieActors,
      year: movieYear ? parseInt(movieYear, 10) : undefined, // Example: Parse year
      synopsis: movieSynopsis?.trim() || undefined        // Example: Add synopsis
  };
  const bookData = {
      title: bookTitle,
      genres: processedBookGenres,
      author: bookAuthor?.trim() || undefined,
      // Add other relevant book fields from req.body here if needed
  };

  // --- *** IMPORTANT: Add Image Paths to Movie/Book Data *** ---
  // If an image for the movie/book is uploaded, add its path and public ID
  // to the respective data object *before* calling findOrCreate.
  if (req.files) {
    // --- Movie Poster ---
    if (req.files.moviePoster?.[0]) {
        // Check if Movie model has posterPath & posterPublicId fields
        movieData.posterPath = req.files.moviePoster[0].path;     // Cloudinary URL
        movieData.posterPublicId = req.files.moviePoster[0].filename; // Cloudinary Public ID
        // console.log('[createConnection] Movie poster uploaded. Adding to movieData:', movieData.posterPath);
    }
    // --- Book Cover ---
    if (req.files.bookCover?.[0]) {
        // Make sure Book model has corresponding fields (e.g., coverPath, coverPublicId)
        bookData.coverPath = req.files.bookCover[0].path;
        bookData.coverPublicId = req.files.bookCover[0].filename;
        // console.log('[createConnection] Book cover uploaded. Adding to bookData:', bookData.coverPath);
    }
    // Screenshot remains connection-specific, handled below
  }

  // --- Find or Create Movie and Book documents ---
  // The findOrCreate helper will now use the movieData/bookData potentially containing image paths
  const movie = await findOrCreate(Movie, { title: movieTitle }, movieData);
  const book = await findOrCreate(Book, { title: bookTitle }, bookData);

  // --- Prepare Connection-Specific Data ---
  const connectionData = {
      userRef: userId,
      movieRef: movie._id,
      bookRef: book._id,
      context: context || '',
      tags: processedTags,
      // Store screenshot info directly on the connection
      screenshotUrl: req.files?.screenshot?.[0]?.path || null,
      screenshotPublicId: req.files?.screenshot?.[0]?.filename || null,
      // Optionally, you could still store redundant copies of movie/book image paths here
      // moviePosterUrl: movie.posterPath, // Example of storing a copy
      // bookCoverUrl: book.coverPath,   // Example of storing a copy
  };

  // --- Create the Connection document ---
  const newConnection = await Connection.create(connectionData);
  // console.log('[createConnection] Connection document created. ID:', newConnection._id);

  // --- Populate the new connection for the response ---
  // This will now pull the Movie/Book documents which *should* contain the image paths
  const populatedConnection = await Connection.findById(newConnection._id)
    .populate('userRef', 'username profileImageUrl _id')
    .populate('movieRef') // Includes fields from Movie model (like posterPath)
    .populate('bookRef');  // Includes fields from Book model (like coverPath)

  if (!populatedConnection) {
    console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`);
    res.status(404); throw new Error('Connection created but could not be retrieved for response.');
  }

  // console.log('[createConnection] Sending success response (201). Populated Movie Ref:', populatedConnection.movieRef);
  res.status(201).json(populatedConnection);
});


// @desc    Get connections (feed) with filtering and pagination using Aggregation
// @route   GET /api/connections?tags=...&movieGenre=...&bookAuthor=...&pageNumber=...
// @access  Public
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
  const connections = await Connection.aggregate([ ...aggregationPipelineBase, { $sort: { createdAt: -1 } }, { $skip: pageSize * (page - 1) }, { $limit: pageSize },
     // *** Project stage: Ensure Movie/Book Refs include necessary fields ***
     { $project: {
        _id: 1, context: 1, tags: 1, likes: 1, favorites: 1, createdAt: 1, updatedAt: 1,
        // Include connection-specific images if needed
        screenshotUrl: 1,
        screenshotPublicId: 1,
        // User reference
        userRef: { _id: '$userData._id', username: '$userData.username', profileImageUrl: '$userData.profileImageUrl' },
        // Movie reference - Include posterPath now!
        movieRef: { _id: '$movieData._id', title: '$movieData.title', genres: '$movieData.genres', director: '$movieData.director', actors: '$movieData.actors', year: '$movieData.year', synopsis: '$movieData.synopsis', posterPath: '$movieData.posterPath' },
        // Book reference - Include coverPath if added to model
        bookRef: { _id: '$bookData._id', title: '$bookData.title', genres: '$bookData.genres', author: '$bookData.author', coverPath: '$bookData.coverPath' }
       }
     }
    ]);
  res.json({ connections, page, pages: Math.ceil(count / pageSize), filterApplied: isFilterApplied, activeFilters: req.query });
});

// @desc    Get popular tags based on frequency in Connections
// @route   GET /api/connections/popular-tags
// @access  Public
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

// @desc    Like/Unlike a connection
// @route   POST /api/connections/:id/like
// @access  Private
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
  if (notificationShouldBeCreated) { try { const notificationMessage = `${username} liked your connection.`; const notification = await Notification.create({ recipientRef: connection.userRef, senderRef: userId, type: 'LIKE', connectionRef: connection._id, message: notificationMessage }); notificationId = notification._id; } catch (notificationError) { console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`); } }
  // Repopulate for response consistency
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
        .populate('userRef', 'username profileImageUrl _id')
        .populate('movieRef') // Includes posterPath
        .populate('bookRef'); // Includes coverPath
  res.json({ connection: updatedConnection, notificationId });
});


// @desc    Favorite/Unfavorite a connection
// @route   POST /api/connections/:id/favorite
// @access  Private
export const favoriteConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for favorite action.'); }
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId);
  if (!connection) { res.status(404); throw new Error('Connection not found'); }
  const connectionCreatorId = connection.userRef;
  const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
  let connectionUpdateOperation;
  let userUpdateOperation;
  let notificationShouldBeCreated = false;
  if (alreadyFavorited) {
    connectionUpdateOperation = { $pull: { favorites: userId } };
    userUpdateOperation = { $pull: { favorites: connectionId } };
  } else {
    connectionUpdateOperation = { $addToSet: { favorites: userId } };
    userUpdateOperation = { $addToSet: { favorites: connectionId } };
    if (!connectionCreatorId.equals(userId)) { notificationShouldBeCreated = true; }
  }
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, connectionUpdateOperation, { new: true });
  if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found during update attempt.'); }
  try { await User.findByIdAndUpdate(userId, userUpdateOperation); } catch (userUpdateError) { console.error(`[favoriteConnection] FAILED to update user ${userId} favorites list:`, userUpdateError); }
  if (notificationShouldBeCreated) { try { const favoriterUsername = req.user.username || 'Someone'; const notificationMessage = `${favoriterUsername} favorited your connection.`; await Notification.create({ recipientRef: connectionCreatorId, senderRef: userId, type: 'FAVORITE', connectionRef: connection._id, message: notificationMessage }); } catch (notificationError) { console.error(`[favoriteConnection] Failed notification creation for FAVORITE: ${notificationError.message}`); } }
  // Repopulate for response
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
      .populate('userRef', 'username profileImageUrl _id')
      .populate('movieRef') // Includes posterPath
      .populate('bookRef'); // Includes coverPath
  if (!updatedConnection) { res.status(500); throw new Error('Failed to retrieve updated connection details.'); }
  res.json(updatedConnection);
});

// @desc    Delete a connection
// @route   DELETE /api/connections/:id
// @access  Private (Owner only)
export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for delete action.'); }
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }

    const connection = await Connection.findById(connectionId);
    if (!connection) { res.status(404); throw new Error('Connection not found'); }
    if (!connection.userRef.equals(userId)) { res.status(403); throw new Error('User not authorized to delete this connection'); }

    // --- Cleanup ---
    // Note: This currently deletes screenshot only. Movie/Book posters are not deleted here
    // because they might be shared by other connections. Add separate logic if needed.
    const publicIdsToDelete = [ connection.screenshotPublicId ].filter(Boolean);
    if (publicIdsToDelete.length > 0) {
        try { await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' }); }
        catch (cloudinaryError) { console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError); }
    }
    // Remove from User favorites
    try { await User.updateMany({ favorites: connectionId }, { $pull: { favorites: connectionId } }); }
    catch (userUpdateError) { console.error(`[deleteConnection] WARNING: Failed to remove connection ${connectionId} from users' favorites lists:`, userUpdateError); }
    // Delete Comments
    try { await Comment.deleteMany({ connection: connectionId }); }
    catch(commentDeleteError) { console.error(`[deleteConnection] WARNING: Failed to delete comments for connection ${connectionId}:`, commentDeleteError); }
    // Delete Notifications
    try { await Notification.deleteMany({ connectionRef: connectionId }); }
    catch (notificationDeleteError) { console.error(`[deleteConnection] WARNING: Failed to delete notifications for connection ${connectionId}:`, notificationDeleteError); }
    // Delete Connection itself
    await Connection.deleteOne({ _id: connectionId });

    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});


// @desc    Get all connections created by a specific user
// @route   GET /api/connections/user/:userId
// @access  Public
export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) { res.status(400); throw new Error('Invalid User ID format'); }
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profileImageUrl _id')
    .populate('movieRef') // Includes posterPath
    .populate('bookRef')  // Includes coverPath
    .sort({ createdAt: -1 });
  res.json(connections || []);
});

// @desc    Get multiple connections by their IDs (for Favorites view)
// @route   POST /api/connections/batch
// @access  Private
export const getConnectionsByIds = asyncHandler(async (req, res) => {
    // console.log('[getConnectionsByIds] Request received. Body:', req.body);
    const { connectionIds } = req.body;
    if (!Array.isArray(connectionIds)) { res.status(400); throw new Error('Request body must contain an array named "connectionIds".'); }
    if (connectionIds.length === 0) { return res.json([]); }
    const validConnectionIds = connectionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validConnectionIds.length === 0) { return res.json([]); }
    // console.log(`[getConnectionsByIds] Fetching ${validConnectionIds.length} valid connection IDs.`);
    const connections = await Connection.find({ _id: { $in: validConnectionIds } })
        .populate('userRef', 'username profileImageUrl _id')
        .populate('movieRef') // Includes posterPath
        .populate('bookRef')  // Includes coverPath
        .sort({ createdAt: -1 });
    // console.log(`[getConnectionsByIds] Found ${connections.length} connections.`);
    res.json(connections || []);
});

// Note: Make sure all exported functions are listed if you modified the export block
// export { createConnection, getConnections, ... }; // Already handled in the code above