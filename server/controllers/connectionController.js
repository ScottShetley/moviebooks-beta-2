// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js'; // Make sure Comment model is imported
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';

// --- Helper Function to process comma-separated strings into arrays ---
const processStringToArray = (inputString) => {
  if (!inputString || typeof inputString !== 'string') { return []; }
  return inputString.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// --- Helper function to find or create Movie/Book ---
const findOrCreate = async (model, query, data) => {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };
    const collation = { locale: 'en', strength: 2 };
    const updateData = {};
    for (const key in data) { if (data[key] !== undefined && data[key] !== null) { updateData[key] = data[key]; } }
    let doc = await model.findOne(query).collation(collation);
    if (doc) {
        let needsUpdate = false;
        for (const key in updateData) {
            if ((key === 'posterPath' || key === 'posterPublicId') && doc.posterPath && updateData.posterPath) { continue; }
            if ((key === 'coverPath' || key === 'coverPublicId') && doc.coverPath && updateData.coverPath) { continue; }
            if (!(key in doc) || JSON.stringify(doc[key]) !== JSON.stringify(updateData[key])) { doc[key] = updateData[key]; needsUpdate = true; }
        }
        if (needsUpdate) { doc = await doc.save(); }
        return doc;
    } else {
        const createData = { ...query, ...updateData };
        return await model.create(createData);
    }
};


/**
 * @desc    Create a new MovieBook connection (now supports text-only)
 * @route   POST /api/connections
 * @access  Private
 */
export const createConnection = asyncHandler(async (req, res, next) => {
  const { movieTitle, movieGenres, movieDirector, movieActors, movieYear, movieSynopsis, bookTitle, bookGenres, bookAuthor, bookPublicationYear, bookIsbn, bookSynopsis, context, tags } = req.body;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('Authentication error: User not found.'); }
  const userId = req.user._id;
  const hasMediaTitles = movieTitle && bookTitle;
  const hasContext = context && context.trim().length > 0;
  if (!hasMediaTitles && !hasContext) { res.status(400); throw new Error('A connection must include either both Movie and Book titles, or Context text.'); }

  const processedTags = processStringToArray(tags);
  let movie = null;
  let book = null;

  if (movieTitle) {
      const processedMovieGenres = processStringToArray(movieGenres);
      const processedMovieActors = processStringToArray(movieActors);
      const movieData = { title: movieTitle, genres: processedMovieGenres, director: movieDirector?.trim() || undefined, actors: processedMovieActors, year: movieYear ? parseInt(movieYear, 10) : undefined, synopsis: movieSynopsis?.trim() || undefined };
      if (req.files?.moviePoster?.[0]) { movieData.posterPath = req.files.moviePoster[0].path; movieData.posterPublicId = req.files.moviePoster[0].filename; }
      movie = await findOrCreate(Movie, { title: movieTitle }, movieData);
  }

  if (bookTitle) {
      const processedBookGenres = processStringToArray(bookGenres);
      const processedBookActors = processStringToArray(bookActors); // Should be processedBookGenres, but keeping as is to match input for now
      const bookData = { title: bookTitle, genres: processedBookGenres, author: bookAuthor?.trim() || undefined, publicationYear: bookPublicationYear ? parseInt(bookPublicationYear, 10) : undefined, isbn: bookIsbn?.trim() || undefined, synopsis: bookSynopsis?.trim() || undefined };
      if (req.files?.bookCover?.[0]) { bookData.coverPath = req.files.bookCover[0].path; bookData.coverPublicId = req.files.bookCover[0].filename; }
      book = await findOrCreate(Book, { title: bookTitle }, bookData);
  }

  if (hasMediaTitles && (!movie || !book)) {
       console.error(`[createConnection] Failed to find/create movie or book document despite titles being provided. Movie: ${movie?._id}, Book: ${book?._id}`);
       res.status(500); throw new Error('Failed to process movie or book information. Please try again.');
   }

  const connectionData = {
      userRef: userId,
      movieRef: movie?._id || null,
      bookRef: book?._id || null,
      context: context?.trim() || '',
      tags: processedTags,
      screenshotUrl: req.files?.screenshot?.[0]?.path || null,
      screenshotPublicId: req.files?.screenshot?.[0]?.filename || null,
  };

  const newConnection = await Connection.create(connectionData);
  const populatedConnection = await Connection.findById(newConnection._id)
    .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
    .populate('movieRef')
    .populate('bookRef');

  if (!populatedConnection) { console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`); res.status(404); throw new Error('Connection created but could not be retrieved for response.'); }
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

  const aggregationPipelineBase = [
    { $lookup: { from: 'movies', localField: 'movieRef', foreignField: '_id', as: 'movieData' } },
    { $unwind: { path: '$movieData', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'books', localField: 'bookRef', foreignField: '_id', as: 'bookData' } },
    { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'userRef', foreignField: '_id', as: 'userData' } },
    { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
    // --- NEW: Lookup comments for each connection ---
    { $lookup: {
        from: 'comments',           // The collection to join
        localField: '_id',          // Field from the input documents (connections)
        foreignField: 'connection', // Field from the documents of the "from" collection (comments)
        as: 'commentsData'          // Output array field name
    } },
    // --- END NEW LOOKUP ---
    { $match: matchStage }
  ];

  const countResult = await Connection.aggregate([...aggregationPipelineBase, { $count: 'totalCount' }]);
  const count = countResult.length > 0 ? countResult[0].totalCount : 0;

  const connections = await Connection.aggregate([
     ...aggregationPipelineBase,
     { $sort: { createdAt: -1 } },
     { $skip: pageSize * (page - 1) },
     { $limit: pageSize },
     // --- *** MODIFIED $project Stage to include commentCount *** ---
     { $project: {
        _id: 1, context: 1, tags: 1, likes: 1, favorites: 1, createdAt: 1, updatedAt: 1,
        screenshotUrl: 1, screenshotPublicId: 1,
        // Ensure userRef includes necessary fields (added displayName)
        userRef: {
             _id: '$userData._id',
             username: '$userData.username',
             profileImageUrl: '$userData.profileImageUrl',
             displayName: '$userData.displayName' // Include displayName
        },
        // Explicitly check if movieData exists and has an _id before including
        movieRef: {
            $cond: {
                if: { $and: [ "$movieData", "$movieData._id" ] },
                then: "$movieData", // Pass the whole object if valid
                else: null         // Otherwise, explicitly set to null
            }
        },
        // Explicitly check if bookData exists and has an _id before including
        bookRef: {
             $cond: {
                 if: { $and: [ "$bookData", "$bookData._id" ] },
                 then: "$bookData", // Pass the whole object if valid
                 else: null        // Otherwise, explicitly set to null
             }
         },
         // --- NEW: Include the size of the commentsData array as commentCount ---
         commentCount: { $size: "$commentsData" }
       }
     }
     // --- *** END MODIFIED $project Stage *** ---
    ]);

  // DEBUG: Log the structure of the first connection object being sent
  // if (connections.length > 0) {
  //   console.log("[getConnections] Sample connection object being sent:", JSON.stringify(connections[0], null, 2));
  // }

  res.json({ connections, page, pages: Math.ceil(count / pageSize), filterApplied: isFilterApplied, activeFilters: req.query });
});


// @desc    Get a single connection by its ID
// @route   GET /api/connections/:id
// @access  Public
export const getConnectionById = asyncHandler(async (req, res) => {
    const connectionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
    const connection = await Connection.findById(connectionId)
        .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
        .populate('movieRef')
        .populate('bookRef');
    if (!connection) { res.status(404); throw new Error('Connection not found'); }
    res.status(200).json(connection);
});


// @desc    Get popular tags based on frequency in Connections
// @route   GET /api/connections/popular-tags
// @access  Public
export const getPopularTags = asyncHandler(async (req, res) => {
    const tagLimit = 15;
    try {
        const popularTags = await Connection.aggregate([ { $match: { tags: { $exists: true, $ne: [] } } }, { $unwind: '$tags' }, { $project: { tagLower: { $toLower: '$tags' } } }, { $group: { _id: '$tagLower', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: tagLimit }, { $project: { _id: 0, tag: '$_id', count: 1 } } ]);
        res.json(popularTags);
    } catch (error) { console.error('[getPopularTags] Error fetching popular tags:', error); res.status(500); throw new Error('Server error fetching popular tags'); }
});

// @desc    Like/Unlike a connection
// @route   POST /api/connections/:id/like
// @access  Private
export const likeConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id || !req.user.username) { res.status(401); throw new Error('User not found or username missing for like action.'); }
  const userId = req.user._id; const username = req.user.username;
  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId);
  if (!connection) { res.status(404); throw new Error('Connection not found'); }
  const alreadyLiked = connection.likes.some(like => like.equals(userId));
  let updateOperation; let notificationShouldBeCreated = false; let notificationId = null;
  if (alreadyLiked) { updateOperation = { $pull: { likes: userId } }; } else { updateOperation = { $addToSet: { likes: userId } }; if (!connection.userRef.equals(userId)) { notificationShouldBeCreated = true; } }
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true });
  if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found after update attempt.'); }
  if (notificationShouldBeCreated) { try { const notificationMessage = `${username} liked your connection.`; const notification = await Notification.create({ recipientRef: connection.userRef, senderRef: userId, type: 'LIKE', connectionRef: connection._id, message: notificationMessage }); notificationId = notification._id; } catch (notificationError) { console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`); } }
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
        .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
        .populate('movieRef')
        .populate('bookRef');
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
  let connectionUpdateOperation; let userUpdateOperation; let notificationShouldBeCreated = false;
  if (alreadyFavorited) { connectionUpdateOperation = { $pull: { favorites: userId } }; userUpdateOperation = { $pull: { favorites: connectionId } }; } else { connectionUpdateOperation = { $addToSet: { favorites: userId } }; userUpdateOperation = { $addToSet: { favorites: connectionId } }; if (!connectionCreatorId.equals(userId)) { notificationShouldBeCreated = true; } }
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, connectionUpdateOperation, { new: true });
  if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found during update attempt.'); }
  try { await User.findByIdAndUpdate(userId, userUpdateOperation); } catch (userUpdateError) { console.error(`[favoriteConnection] FAILED to update user ${userId} favorites list:`, userUpdateError); }
  if (notificationShouldBeCreated) { try { const favoriterUsername = req.user.username || 'Someone'; const notificationMessage = `${favoriterUsername} favorited your connection.`; await Notification.create({ recipientRef: connectionCreatorId, senderRef: userId, type: 'FAVORITE', connectionRef: connection._id, message: notificationMessage }); } catch (notificationError) { console.error(`[favoriteConnection] Failed notification creation for FAVORITE: ${notificationError.message}`); } }
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
      .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
      .populate('movieRef')
      .populate('bookRef');
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
    const publicIdsToDelete = [ connection.screenshotPublicId ].filter(Boolean);
    if (publicIdsToDelete.length > 0) { try { await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' }); } catch (cloudinaryError) { console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError); } }
    try { await User.updateMany({ favorites: connectionId }, { $pull: { favorites: connectionId } }); } catch (userUpdateError) { console.error(`[deleteConnection] WARNING: Failed to remove connection ${connectionId} from users' favorites lists:`, userUpdateError); }
    try { await Comment.deleteMany({ connection: connectionId }); } catch(commentDeleteError) { console.error(`[deleteConnection] WARNING: Failed to delete comments for connection ${connectionId}:`, commentDeleteError); }
    try { await Notification.deleteMany({ connectionRef: connectionId }); } catch (notificationDeleteError) { console.error(`[deleteConnection] WARNING: Failed to delete notifications for connection ${connectionId}:`, notificationDeleteError); }
    await Connection.deleteOne({ _id: connectionId });
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});


// @desc    Get all connections created by a specific user
// @route   GET /api/connections/user/:userId
// @access  Public
export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) { res.status(400); throw new Error('Invalid User ID format'); }
  // NOTE: commentCount is currently NOT included here, only in getConnections (main feed)
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
    .populate('movieRef')
    .populate('bookRef')
    .sort({ createdAt: -1 });
  res.json(connections || []);
});

// @desc    Get multiple connections by their IDs (for Favorites view)
// @route   POST /api/connections/batch
// @access  Private
export const getConnectionsByIds = asyncHandler(async (req, res) => {
    const { connectionIds } = req.body;
    if (!Array.isArray(connectionIds)) { res.status(400); throw new Error('Request body must contain an array named "connectionIds".'); }
    if (connectionIds.length === 0) { return res.json([]); }
    const validConnectionIds = connectionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validConnectionIds.length === 0) { return res.json([]); }
    // NOTE: commentCount is currently NOT included here, only in getConnections (main feed)
    const connections = await Connection.find({ _id: { $in: validConnectionIds } })
        .populate('userRef', 'username profileImageUrl _id displayName') // Added displayName
        .populate('movieRef')
        .populate('bookRef')
        .sort({ createdAt: -1 });
    res.json(connections || []);
});