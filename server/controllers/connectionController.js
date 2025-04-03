// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
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
  console.log('[createConnection] Starting process...');
  console.log('[createConnection] Authenticated User ID:', userId);
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
  console.log('[createConnection] Connection document created. ID:', newConnection._id);
  const populatedConnection = await Connection.findById(newConnection._id).populate('userRef', 'username profileImageUrl _id').populate('movieRef').populate('bookRef');
  if (!populatedConnection) { console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`); res.status(404); throw new Error('Connection created but could not be retrieved for response.'); }
  console.log('[createConnection] Sending success response (201).');
  res.status(201).json(populatedConnection);
});

/**
 * @desc    Get connections (feed) with filtering and pagination using Aggregation
 * @route   GET /api/connections?tags=...&movieGenre=...&bookAuthor=...&pageNumber=...
 * @access  Public
 */
export const getConnections = asyncHandler(async (req, res, next) => {
  // console.log('[getConnections] Fetching connections via AGGREGATION...'); // Reduced logging noise
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const { tags, movieGenre, director, actor, bookGenre, author } = req.query;
  // console.log('[getConnections] Received query params:', req.query); // Reduced logging noise
  const matchStage = {};
  if (tags && typeof tags === 'string' && tags.trim() !== '') { const tagsArray = processStringToArray(tags); if (tagsArray.length > 0) { matchStage.tags = { $in: tagsArray }; /* console.log(`[getConnections] Adding filter: tags IN [${tagsArray.join(', ')}]`); */ } }
  if (movieGenre && typeof movieGenre === 'string' && movieGenre.trim() !== '') { matchStage['movieData.genres'] = { $regex: `^${movieGenre.trim()}$`, $options: 'i' }; /* console.log(`[getConnections] Adding filter: movieGenre = '${movieGenre.trim()}' (case-insensitive)`); */ }
  if (director && typeof director === 'string' && director.trim() !== '') { matchStage['movieData.director'] = { $regex: `^${director.trim()}$`, $options: 'i' }; /* console.log(`[getConnections] Adding filter: director = '${director.trim()}' (case-insensitive)`); */ }
  if (actor && typeof actor === 'string' && actor.trim() !== '') { matchStage['movieData.actors'] = { $regex: `^${actor.trim()}$`, $options: 'i' }; /* console.log(`[getConnections] Adding filter: actor IN movieActors = '${actor.trim()}' (case-insensitive)`); */ }
  if (bookGenre && typeof bookGenre === 'string' && bookGenre.trim() !== '') { matchStage['bookData.genres'] = { $regex: `^${bookGenre.trim()}$`, $options: 'i' }; /* console.log(`[getConnections] Adding filter: bookGenre = '${bookGenre.trim()}' (case-insensitive)`); */ }
  if (author && typeof author === 'string' && author.trim() !== '') { matchStage['bookData.author'] = { $regex: `^${author.trim()}$`, $options: 'i' }; /* console.log(`[getConnections] Adding filter: author = '${author.trim()}' (case-insensitive)`); */ }
  // console.log('[getConnections] Final $match stage:', JSON.stringify(matchStage)); // Reduced logging noise
  const isFilterApplied = Object.keys(matchStage).length > 0;
  const aggregationPipelineBase = [ { $lookup: { from: 'movies', localField: 'movieRef', foreignField: '_id', as: 'movieData' } }, { $unwind: { path: '$movieData', preserveNullAndEmptyArrays: true } }, { $lookup: { from: 'books', localField: 'bookRef', foreignField: '_id', as: 'bookData' } }, { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } }, { $lookup: { from: 'users', localField: 'userRef', foreignField: '_id', as: 'userData' } }, { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }, { $match: matchStage } ];
  // console.log('[getConnections] Executing COUNT aggregation...'); // Reduced logging noise
  const countResult = await Connection.aggregate([...aggregationPipelineBase, { $count: 'totalCount' }]);
  const count = countResult.length > 0 ? countResult[0].totalCount : 0;
  // console.log(`[getConnections] COUNT aggregation result: ${count}`); // Reduced logging noise
  // console.log('[getConnections] Executing DATA aggregation...'); // Reduced logging noise
  const connections = await Connection.aggregate([ ...aggregationPipelineBase, { $sort: { createdAt: -1 } }, { $skip: pageSize * (page - 1) }, { $limit: pageSize }, { $project: { _id: 1, context: 1, tags: 1, moviePosterUrl: 1, bookCoverUrl: 1, screenshotUrl: 1, likes: 1, favorites: 1, createdAt: 1, updatedAt: 1, userRef: { _id: '$userData._id', username: '$userData.username', profileImageUrl: '$userData.profileImageUrl' }, movieRef: { _id: '$movieData._id', title: '$movieData.title', genres: '$movieData.genres', director: '$movieData.director', actors: '$movieData.actors' }, bookRef: { _id: '$bookData._id', title: '$bookData.title', genres: '$bookData.genres', author: '$bookData.author' } } } ]);
  // console.log(`[getConnections] DATA aggregation returned ${connections.length} documents for page ${page}.`); // Reduced logging noise
  res.json({ connections, page, pages: Math.ceil(count / pageSize), filterApplied: isFilterApplied, activeFilters: req.query });
});

/**
 * @desc    Get popular tags based on frequency in Connections
 * @route   GET /api/connections/popular-tags
 * @access  Public
 */
export const getPopularTags = asyncHandler(async (req, res) => {
    // console.log('[getPopularTags] Fetching popular tags...'); // Reduced logging noise
    const tagLimit = 15;
    try { const popularTags = await Connection.aggregate([ { $match: { tags: { $exists: true, $ne: [] } } }, { $unwind: '$tags' }, { $project: { tagLower: { $toLower: '$tags' } } }, { $group: { _id: '$tagLower', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: tagLimit }, { $project: { _id: 0, tag: '$_id', count: 1 } } ]); /* console.log(`[getPopularTags] Found ${popularTags.length} popular tags.`); */ res.json(popularTags); } catch (error) { console.error('[getPopularTags] Error fetching popular tags:', error); res.status(500); throw new Error('Server error fetching popular tags'); }
});

/** =========================================================================
 *                           LIKE CONNECTION (MODIFIED)
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
  if (notificationShouldBeCreated) { try { const notificationMessage = `${username} liked your connection.`; const notification = await Notification.create({ recipientRef: connection.userRef, senderRef: userId, type: 'LIKE', connectionRef: connection._id, message: notificationMessage }); notificationId = notification._id; console.log(`[likeConnection] Notification created: ${notificationId} with message: "${notificationMessage}"`); } catch (notificationError) { console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`); } }
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id).populate('userRef', 'username profileImageUrl _id').populate('movieRef').populate('bookRef');
  res.json({ connection: updatedConnection, notificationId });
});

/** =========================================================================
 *                       FAVORITE CONNECTION (MODIFIED)
 *  =========================================================================
 */
export const favoriteConnection = asyncHandler(async (req, res, next) => {
  // --- NEW LOG --- Add this line
  console.log(`[favoriteConnection] Controller invoked for connection ID: ${req.params.id} by user: ${req.user?._id}`);
  // ---------------

  const connectionId = req.params.id;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for favorite action.'); }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId);
  if (!connection) { res.status(404); throw new Error('Connection not found'); }

  const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
  let updateOperation;
  if (alreadyFavorited) {
    updateOperation = { $pull: { favorites: userId } };
    console.log(`[favoriteConnection] User ${userId} UN-favoriting connection ${connectionId}`); // Existing log
  } else {
    updateOperation = { $addToSet: { favorites: userId } };
    console.log(`[favoriteConnection] User ${userId} FAVORITING connection ${connectionId}`); // Existing log
  }

  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true });
   if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found after update attempt.'); }

   const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
     .populate('userRef', 'username profileImageUrl _id')
     .populate('movieRef')
     .populate('bookRef');

   if (!updatedConnection) { console.error(`[favoriteConnection] CRITICAL: Failed to populate connection ${connectionId} after update.`); res.status(500); throw new Error('Failed to retrieve updated connection details.'); }

   console.log(`[favoriteConnection] Success for connection ${connectionId}. Favorites count: ${updatedConnection.favorites.length}`); // Existing log
  res.json(updatedConnection);
});
/** =========================================================================
 *                      END FAVORITE CONNECTION
 *  =========================================================================
 */


export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for delete action.'); }
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
    const connection = await Connection.findById(connectionId);
    if (!connection) { res.status(404); throw new Error('Connection not found'); }
    if (!connection.userRef.equals(userId)) { res.status(403); throw new Error('User not authorized to delete this connection'); }
    const publicIdsToDelete = [ connection.moviePosterPublicId, connection.bookCoverPublicId, connection.screenshotPublicId ].filter(Boolean);
    if (publicIdsToDelete.length > 0) { try { await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' }); console.log('[deleteConnection] Cloudinary deletion request finished.'); } catch (cloudinaryError) { console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError); } }
    await Connection.deleteOne({ _id: connectionId });
    await Comment.deleteMany({ connection: connectionId }); // Assuming FK is 'connection' in Comment model
    await Notification.deleteMany({ connectionRef: connectionId });
    console.log(`[deleteConnection] Sending success (200) for ${connectionId}.`);
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});


export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) { res.status(400); throw new Error('Invalid User ID format'); }
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profileImageUrl _id')
    .populate('movieRef')
    .populate('bookRef')
    .sort({ createdAt: -1 });
  res.json(connections || []);
});