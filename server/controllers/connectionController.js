// server/controllers/connectionController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import Movie from '../models/Movie.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import cloudinary from '../config/cloudinary.js';

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
// Now accepts and merges additional data (genres, director, etc.)
const findOrCreate = async (model, query, data) => {
  const options = {
    upsert: true, // Create if not found
    new: true, // Return the modified document
    setDefaultsOnInsert: true, // Apply schema defaults on insert
    runValidators: true, // Run schema validators
  };
  const collation = {locale: 'en', strength: 2}; // Case-insensitive matching for query

  // Use $set to update fields, ensuring existing data isn't overwritten unnecessarily
  // Only set fields if they are provided in the 'data' object
  const updateData = {};
  for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
          // Special handling for arrays to avoid replacing if empty - add default empty array instead
          if (Array.isArray(data[key])) {
               updateData[key] = data[key].length > 0 ? data[key] : [];
          } else if (typeof data[key] === 'string' && data[key].trim() === '') {
               // Don't set empty strings if that's not desired, handle as needed
               // For now, let's allow setting empty strings if passed explicitly
               updateData[key] = data[key];
          } else {
               updateData[key] = data[key];
          }
      }
  }

  console.log(`[findOrCreate] Model: ${model.modelName}, Query: ${JSON.stringify(query)}, Update Data: ${JSON.stringify(updateData)}`);

  // Find existing first (case-insensitive title)
  let doc = await model.findOne(query).collation(collation);

  if (doc) {
      console.log(`[findOrCreate] Found existing ${model.modelName} ID: ${doc._id}`);
      // Update existing document if new data is provided
      let needsUpdate = false;
      for (const key in updateData) {
          // Simple check: if key exists in updateData and is different or not present in doc
          // More robust check might be needed for arrays (e.g., check if arrays differ)
           if (!(key in doc) || JSON.stringify(doc[key]) !== JSON.stringify(updateData[key])) {
                doc[key] = updateData[key];
                needsUpdate = true;
           }
      }
       if (needsUpdate) {
            console.log(`[findOrCreate] Updating existing ${model.modelName}...`);
            doc = await doc.save(); // Save changes to the found document
       }
       return doc;
  } else {
      // Create new document if not found
      console.log(`[findOrCreate] Creating new ${model.modelName}...`);
      // Merge query fields (like title) into the data to ensure they are set on creation
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
  // Destructure all expected fields from request body
  const {
    movieTitle, movieGenres, movieDirector, movieActors, // Movie details
    bookTitle, bookGenres, bookAuthor,                   // Book details
    context, tags                                        // Connection details
  } = req.body;

  if (!req.user || !req.user._id) {
    res.status(401); throw new Error('Authentication error: User not found.');
  }
  const userId = req.user._id;

  console.log('[createConnection] Starting process...');
  console.log('[createConnection] Request Body (Text Fields):', JSON.stringify(req.body, null, 2));
  console.log('[createConnection] Authenticated User ID:', userId);

  if (!movieTitle || !bookTitle) {
    res.status(400); throw new Error('Movie title and Book title are required');
  }

  // --- Process incoming arrays (tags, genres, actors) ---
  const processedTags = processStringToArray(tags);
  const processedMovieGenres = processStringToArray(movieGenres);
  const processedMovieActors = processStringToArray(movieActors);
  const processedBookGenres = processStringToArray(bookGenres);
  console.log('[createConnection] Processed Tags:', processedTags);
  console.log('[createConnection] Processed Movie Genres:', processedMovieGenres);
  console.log('[createConnection] Processed Movie Actors:', processedMovieActors);
  console.log('[createConnection] Processed Book Genres:', processedBookGenres);
  // --- End Array Processing ---

  // --- Find or Create Movie and Book with new details ---
  const movieData = {
    title: movieTitle,
    genres: processedMovieGenres,
    director: movieDirector?.trim() || undefined, // Send undefined if empty/null
    actors: processedMovieActors,
  };
  const bookData = {
    title: bookTitle,
    genres: processedBookGenres,
    author: bookAuthor?.trim() || undefined, // Send undefined if empty/null
  };

  const movie = await findOrCreate(Movie, { title: movieTitle }, movieData);
  const book = await findOrCreate(Book, { title: bookTitle }, bookData);
  // --- End Find or Create ---


  // Prepare core connection data
  const connectionData = {
    userRef: userId,
    movieRef: movie._id,
    bookRef: book._id,
    context: context || '',
    tags: processedTags, // Add the processed tags
  };

  // Process Uploaded Files (No change here)
  if (req.files) {
    if (req.files.moviePoster?.[0]) {
      connectionData.moviePosterUrl = req.files.moviePoster[0].path;
      connectionData.moviePosterPublicId = req.files.moviePoster[0].filename;
    }
    if (req.files.bookCover?.[0]) {
      connectionData.bookCoverUrl = req.files.bookCover[0].path;
      connectionData.bookCoverPublicId = req.files.bookCover[0].filename;
    }
    if (req.files.screenshot?.[0]) {
      connectionData.screenshotUrl = req.files.screenshot[0].path;
      connectionData.screenshotPublicId = req.files.screenshot[0].filename;
    }
  }

  // Create the connection
  const newConnection = await Connection.create(connectionData);
  console.log('[createConnection] Connection document created. ID:', newConnection._id);

  // --- Populate response manually after creation (Aggregation not needed here) ---
   const populatedConnection = await Connection.findById(newConnection._id)
      .populate('userRef', 'username profileImageUrl _id')
      // Populate the *full* movie/book docs now, including new fields
      .populate('movieRef')
      .populate('bookRef');

  if (!populatedConnection) {
    console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`);
    res.status(404); throw new Error('Connection created but could not be retrieved for response.');
  }

  console.log('[createConnection] Sending success response (201).');
  res.status(201).json(populatedConnection);

}); // End createConnection

/**
 * @desc    Get connections (feed) with filtering and pagination using Aggregation
 * @route   GET /api/connections?tags=...&movieGenre=...&bookAuthor=...&pageNumber=...
 * @access  Public
 */
export const getConnections = asyncHandler(async (req, res, next) => {
  console.log('[getConnections] Fetching connections via AGGREGATION...');
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  // --- Extract Filter Parameters from Query String ---
  const {
      tags,         // Connection tags (comma-separated string)
      movieGenre,   // Movie genre (single string for now, could adapt for multi)
      director,     // Movie director (string)
      actor,        // Movie actor (single string for now, check if exists in array)
      bookGenre,    // Book genre (single string for now)
      author        // Book author (string)
  } = req.query;
  console.log('[getConnections] Received query params:', req.query);

  // --- Build the $match stage for filtering ---
  const matchStage = {};

  // 1. Filter by Connection Tags
  if (tags && typeof tags === 'string' && tags.trim() !== '') {
      const tagsArray = processStringToArray(tags);
      if (tagsArray.length > 0) {
          matchStage.tags = { $in: tagsArray }; // Match if connection has ANY of the tags
          console.log(`[getConnections] Adding filter: tags IN [${tagsArray.join(', ')}]`);
      }
  }

  // 2. Filter by Movie properties (requires data joined from 'movieData')
  if (movieGenre && typeof movieGenre === 'string' && movieGenre.trim() !== '') {
       // Assumes case-insensitive match within the 'genres' array
       matchStage['movieData.genres'] = { $regex: `^${movieGenre.trim()}$`, $options: 'i' };
       console.log(`[getConnections] Adding filter: movieGenre = '${movieGenre.trim()}' (case-insensitive)`);
  }
   if (director && typeof director === 'string' && director.trim() !== '') {
       // Case-insensitive match for director string
       matchStage['movieData.director'] = { $regex: `^${director.trim()}$`, $options: 'i' };
       console.log(`[getConnections] Adding filter: director = '${director.trim()}' (case-insensitive)`);
  }
  if (actor && typeof actor === 'string' && actor.trim() !== '') {
       // Case-insensitive match within the 'actors' array
       matchStage['movieData.actors'] = { $regex: `^${actor.trim()}$`, $options: 'i' };
        console.log(`[getConnections] Adding filter: actor IN movieActors = '${actor.trim()}' (case-insensitive)`);
  }

  // 3. Filter by Book properties (requires data joined from 'bookData')
   if (bookGenre && typeof bookGenre === 'string' && bookGenre.trim() !== '') {
       matchStage['bookData.genres'] = { $regex: `^${bookGenre.trim()}$`, $options: 'i' };
        console.log(`[getConnections] Adding filter: bookGenre = '${bookGenre.trim()}' (case-insensitive)`);
   }
   if (author && typeof author === 'string' && author.trim() !== '') {
       matchStage['bookData.author'] = { $regex: `^${author.trim()}$`, $options: 'i' };
        console.log(`[getConnections] Adding filter: author = '${author.trim()}' (case-insensitive)`);
   }

  console.log('[getConnections] Final $match stage:', JSON.stringify(matchStage));
  const isFilterApplied = Object.keys(matchStage).length > 0;

  // --- Aggregation Pipeline Definition ---
  const aggregationPipelineBase = [
    // Stage 1: Lookup Movie Data
    {
      $lookup: {
        from: 'movies', // The collection name
        localField: 'movieRef',
        foreignField: '_id',
        as: 'movieData',
      },
    },
    // Stage 2: Unwind Movie Data (handle cases where lookup might fail gracefully)
     { $unwind: { path: '$movieData', preserveNullAndEmptyArrays: true } }, // Keep connection even if movie somehow deleted

    // Stage 3: Lookup Book Data
    {
      $lookup: {
        from: 'books',
        localField: 'bookRef',
        foreignField: '_id',
        as: 'bookData',
      },
    },
     // Stage 4: Unwind Book Data
     { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } },

    // Stage 5: Lookup User Data
    {
      $lookup: {
        from: 'users',
        localField: 'userRef',
        foreignField: '_id',
        as: 'userData',
      },
    },
     // Stage 6: Unwind User Data
     { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }, // Keep connection even if user somehow deleted

    // Stage 7: Apply the constructed $match filter
    { $match: matchStage },
  ];

  // --- Execute Aggregation for COUNT ---
  const countPipeline = [
      ...aggregationPipelineBase,
      { $count: 'totalCount' } // Count documents matching the filters
  ];
  console.log('[getConnections] Executing COUNT aggregation...');
  const countResult = await Connection.aggregate(countPipeline);
  const count = countResult.length > 0 ? countResult[0].totalCount : 0;
  console.log(`[getConnections] COUNT aggregation result: ${count}`);

  // --- Execute Aggregation for DATA ---
  const dataPipeline = [
      ...aggregationPipelineBase,
      // Stage 8: Sort results (e.g., by creation date)
      { $sort: { createdAt: -1 } },
      // Stage 9: Skip for pagination
      { $skip: pageSize * (page - 1) },
      // Stage 10: Limit for pagination
      { $limit: pageSize },
      // Stage 11: Project to reshape the output (optional but good practice)
      {
        $project: {
          // Include connection fields explicitly
          _id: 1,
          context: 1,
          tags: 1,
          moviePosterUrl: 1,
          bookCoverUrl: 1,
          screenshotUrl: 1,
          likes: 1,
          favorites: 1,
          createdAt: 1,
          updatedAt: 1,
          // Reshape joined data to mimic populate structure (or adjust frontend)
          userRef: {
            _id: '$userData._id',
            username: '$userData.username',
            profileImageUrl: '$userData.profileImageUrl', // Add if you have this field
          },
          movieRef: { // Keep nested structure if frontend expects it
            _id: '$movieData._id',
            title: '$movieData.title',
            genres: '$movieData.genres',
            director: '$movieData.director',
            actors: '$movieData.actors',
          },
          bookRef: {
             _id: '$bookData._id',
             title: '$bookData.title',
             genres: '$bookData.genres',
             author: '$bookData.author',
          },
        }
      }
  ];
  console.log('[getConnections] Executing DATA aggregation...');
  const connections = await Connection.aggregate(dataPipeline);
  console.log(`[getConnections] DATA aggregation returned ${connections.length} documents for page ${page}.`);


  // --- Send Paginated Response Object ---
  res.json({
    connections,
    page,
    pages: Math.ceil(count / pageSize),
    filterApplied: isFilterApplied,
    activeFilters: req.query, // Send back the raw query params as active filters
    // count: count // Optionally send total count if needed by frontend
  });
}); // End getConnections

// --- LIKE / FAVORITE / DELETE / GET BY USER ID ---
// These functions remain largely the same for now, using findById/find and populate.
// They could be converted to aggregation later if complex filtering/joining is needed
// within their specific contexts, but it's not strictly necessary for Phase 2 filtering
// on the main feed.

export const likeConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for like action.'); }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId); // Find the connection
  if (!connection) { res.status(404); throw new Error('Connection not found'); }

  const alreadyLiked = connection.likes.some(like => like.equals(userId));
  let updateOperation;
  let notificationCreated = false;
  let notificationId = null;

  if (alreadyLiked) {
    updateOperation = { $pull: { likes: userId } };
  } else {
    updateOperation = { $addToSet: { likes: userId } };
    if (!connection.userRef.equals(userId)) { notificationCreated = true; }
  }

  // Update the connection
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true });
   if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found after update attempt.'); }

  // Create notification if needed
  if (notificationCreated) {
      try {
          const notification = await Notification.create({
              recipientRef: connection.userRef, senderRef: userId, type: 'LIKE', connectionRef: connection._id,
          });
          notificationId = notification._id;
          console.log(`[likeConnection] Notification created: ${notificationId}`);
      } catch (notificationError) { console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`); }
  }

  // Populate the response fully (including new movie/book fields)
   const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
     .populate('userRef', 'username profileImageUrl _id')
     .populate('movieRef') // Populate full movie doc
     .populate('bookRef');  // Populate full book doc

   console.log(`[likeConnection] Updated. Likes: ${updatedConnection.likes.length}`);
  res.json({ connection: updatedConnection, notificationId });
});

export const favoriteConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for favorite action.'); }
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }
  const connection = await Connection.findById(connectionId);
  if (!connection) { res.status(404); throw new Error('Connection not found'); }

  const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));
  let updateOperation;
  if (alreadyFavorited) { updateOperation = { $pull: { favorites: userId } }; }
  else { updateOperation = { $addToSet: { favorites: userId } }; }

  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true });
   if (!updatedConnectionRaw) { res.status(404); throw new Error('Connection not found after update attempt.'); }

   // Populate fully
   const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
     .populate('userRef', 'username profileImageUrl _id')
     .populate('movieRef')
     .populate('bookRef');

   console.log(`[favoriteConnection] Updated. Favorites: ${updatedConnection.favorites.length}`);
  res.json(updatedConnection);
});

export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    if (!req.user || !req.user._id) { res.status(401); throw new Error('User not found for delete action.'); }
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) { res.status(400); throw new Error('Invalid Connection ID format'); }

    const connection = await Connection.findById(connectionId);
    if (!connection) { res.status(404); throw new Error('Connection not found'); }

    if (!connection.userRef.equals(userId)) {
        res.status(403); throw new Error('User not authorized to delete this connection');
    }

    // Delete Images from Cloudinary
    const publicIdsToDelete = [ connection.moviePosterPublicId, connection.bookCoverPublicId, connection.screenshotPublicId ].filter(Boolean);
    if (publicIdsToDelete.length > 0) {
        try {
            await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' });
            console.log('[deleteConnection] Cloudinary deletion request finished.');
        } catch (cloudinaryError) { console.error(`[deleteConnection] WARNING: Error deleting Cloudinary images:`, cloudinaryError); }
    }

    // Delete Connection, Comments, Notifications (No change needed here)
    await Connection.deleteOne({ _id: connectionId });
    await Comment.deleteMany({ connectionRef: connectionId });
    await Notification.deleteMany({ connectionRef: connectionId });

    console.log(`[deleteConnection] Sending success (200) for ${connectionId}.`);
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});

export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  // TODO: Add pagination similar to getConnections (would likely require aggregation here too)
  // TODO: Add filtering similar to getConnections if needed on profile pages?

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    res.status(400); throw new Error('Invalid User ID format');
  }

  // Still using populate here for now, but populate full docs
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profileImageUrl _id')
    .populate('movieRef') // Populate full movie doc
    .populate('bookRef')  // Populate full book doc
    .sort({ createdAt: -1 });

  res.json(connections || []);
});