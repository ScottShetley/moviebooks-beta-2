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
/**
 * Converts a comma-separated string into an array of trimmed, non-empty strings.
 * @param {string | undefined | null} inputString - The string to process.
 * @returns {string[]} An array of strings.
 */
const processStringToArray = (inputString) => {
  if (!inputString || typeof inputString !== 'string') { return []; }
  // Split by comma, trim whitespace from each item, and filter out any empty strings resulting from extra commas.
  return inputString.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// --- Helper function to find or create Movie/Book ---
/**
 * Finds a document based on a query or creates it if not found (upsert).
 * Uses case-insensitive collation for the find query.
 * Selectively updates fields if the document exists and data differs,
 * with special handling to avoid overwriting existing image paths if no new path is provided.
 * @param {mongoose.Model} model - The Mongoose model (e.g., Movie, Book).
 * @param {object} query - The query object to find the document (e.g., { title: movieTitle }).
 * @param {object} data - The data to use for creation or update.
 * @returns {Promise<mongoose.Document>} The found or created/updated document.
 */
const findOrCreate = async (model, query, data) => {
    // Options for findOneAndUpdate (upsert: create if not found, new: return updated doc)
    // const options = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }; // Alternative using findOneAndUpdate

    // Use case-insensitive matching for the title lookup (strength: 2 ignores case and diacritics)
    const collation = { locale: 'en', strength: 2 };

    // Prepare update data, filtering out null/undefined values
    const updateData = {};
    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
            updateData[key] = data[key];
        }
    }

    // Try to find the document using case-insensitive query
    let doc = await model.findOne(query).collation(collation);

    if (doc) {
        // Document found, check if an update is needed
        let needsUpdate = false;
        for (const key in updateData) {
            // Special handling for image paths: Don't overwrite an existing path if the incoming data doesn't provide a new one.
            // This prevents accidental removal of images if the form submission omits the file.
            if ((key === 'posterPath' || key === 'posterPublicId') && doc.posterPath && !updateData.posterPath) { continue; }
            if ((key === 'coverPath' || key === 'coverPublicId') && doc.coverPath && !updateData.coverPath) { continue; }

            // Check if the field doesn't exist on the doc or if the value differs
            // Use JSON.stringify for a simple deep comparison, suitable for basic types/arrays here.
            if (!(key in doc) || JSON.stringify(doc[key]) !== JSON.stringify(updateData[key])) {
                doc[key] = updateData[key];
                needsUpdate = true;
            }
        }
        // If any field was updated, save the document
        if (needsUpdate) {
            doc = await doc.save();
        }
        return doc; // Return the existing (potentially updated) document
    } else {
        // Document not found, create it using the query and the provided data
        const createData = { ...query, ...updateData };
        return await model.create(createData);
    }
};


/**
 * @desc    Create a new MovieBook connection (supports text-only or media+text)
 * @route   POST /api/connections
 * @access  Private (Requires login)
 */
export const createConnection = asyncHandler(async (req, res, next) => {
  // Extract data from request body and files
  const {
    movieTitle, movieGenres, movieDirector, movieActors, movieYear, movieSynopsis,
    bookTitle, bookGenres, bookAuthor, bookPublicationYear, bookIsbn, bookSynopsis,
    context, tags
  } = req.body;

  // Ensure user is authenticated (should be handled by middleware, but good failsafe)
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Authentication error: User not found.');
  }
  const userId = req.user._id;

  // Validate required fields: Must have movie+book titles OR context text
  const hasMediaTitles = movieTitle && bookTitle;
  const hasContext = context && context.trim().length > 0;
  if (!hasMediaTitles && !hasContext) {
    res.status(400);
    throw new Error('A connection must include either both Movie and Book titles, or Context text.');
  }

  // Process tags string into an array
  const processedTags = processStringToArray(tags);

  let movie = null;
  let book = null;

  // --- Find or Create Movie ---
  if (movieTitle) {
      const processedMovieGenres = processStringToArray(movieGenres);
      const processedMovieActors = processStringToArray(movieActors);
      const movieData = {
          title: movieTitle, // Query field
          genres: processedMovieGenres,
          director: movieDirector?.trim() || undefined,
          actors: processedMovieActors,
          year: movieYear ? parseInt(movieYear, 10) : undefined,
          synopsis: movieSynopsis?.trim() || undefined
      };
      // Add poster info if uploaded (assumes middleware populates req.files)
      if (req.files?.moviePoster?.[0]) {
          movieData.posterPath = req.files.moviePoster[0].path; // Cloudinary URL
          movieData.posterPublicId = req.files.moviePoster[0].filename; // Cloudinary public ID
      }
      movie = await findOrCreate(Movie, { title: movieTitle }, movieData);
  }

  // --- Find or Create Book ---
  if (bookTitle) {
      const processedBookGenres = processStringToArray(bookGenres);
      const bookData = {
          title: bookTitle, // Query field
          genres: processedBookGenres,
          author: bookAuthor?.trim() || undefined,
          publicationYear: bookPublicationYear ? parseInt(bookPublicationYear, 10) : undefined,
          isbn: bookIsbn?.trim() || undefined,
          synopsis: bookSynopsis?.trim() || undefined
      };
      // Add cover info if uploaded
      if (req.files?.bookCover?.[0]) {
          bookData.coverPath = req.files.bookCover[0].path; // Cloudinary URL
          bookData.coverPublicId = req.files.bookCover[0].filename; // Cloudinary public ID
      }
      book = await findOrCreate(Book, { title: bookTitle }, bookData);
  }

  // If titles were provided but findOrCreate failed, something went wrong internally.
  if (hasMediaTitles && (!movie || !book)) {
       console.error(`[createConnection] Failed to find/create movie or book document despite titles being provided. Movie: ${movie?._id}, Book: ${book?._id}`);
       res.status(500);
       throw new Error('Failed to process movie or book information. Please try again.');
   }

  // --- Create Connection ---
  const connectionData = {
      userRef: userId,
      movieRef: movie?._id || null, // Store ObjectId or null
      bookRef: book?._id || null,   // Store ObjectId or null
      context: context?.trim() || '', // Ensure context is a string
      tags: processedTags,
      // Add screenshot info if uploaded
      screenshotUrl: req.files?.screenshot?.[0]?.path || null,
      screenshotPublicId: req.files?.screenshot?.[0]?.filename || null,
  };

  const newConnection = await Connection.create(connectionData);

  // Populate references for the response to include details needed by the frontend
  const populatedConnection = await Connection.findById(newConnection._id)
    .populate('userRef', 'username profilePictureUrl _id displayName') // Use profilePictureUrl for consistency
    .populate('movieRef') // Populate with full movie document
    .populate('bookRef');  // Populate with full book document

  // Handle rare case where population fails immediately after creation
  if (!populatedConnection) {
      console.error(`[createConnection] CRITICAL: Connection created (ID: ${newConnection._id}) but failed to populate!`);
      res.status(500); // Use 500 Internal Server Error
      throw new Error('Connection created but could not be retrieved for response.');
  }

  // Send the newly created and populated connection
  res.status(201).json(populatedConnection);
});


/**
 * @desc    Get connections (feed) with filtering and pagination using Aggregation
 * @route   GET /api/connections?tags=...&movieGenre=...&bookAuthor=...&pageNumber=...
 * @access  Public
 */
export const getConnections = asyncHandler(async (req, res, next) => {
  const pageSize = 10; // Number of connections per page
  const page = Number(req.query.pageNumber) || 1; // Current page number
  const { tags, movieGenre, director, actor, bookGenre, author } = req.query; // Filter parameters

  // --- Build the $match stage for filtering ---
  const matchStage = {};
  // Filter by tags (case-insensitive match within the tags array)
  if (tags && typeof tags === 'string' && tags.trim() !== '') {
      const tagsArray = processStringToArray(tags);
      if (tagsArray.length > 0) {
          // Match connections where the 'tags' array contains any of the provided tags (case-insensitive)
          matchStage.tags = { $in: tagsArray.map(tag => new RegExp(`^${tag}$`, 'i')) };
      }
  }
  // Filter by movie genre (case-insensitive exact match within the movie's genres array)
  if (movieGenre && typeof movieGenre === 'string' && movieGenre.trim() !== '') {
      matchStage['movieData.genres'] = { $regex: `^${movieGenre.trim()}$`, $options: 'i' };
  }
  // Filter by movie director (case-insensitive exact match)
  if (director && typeof director === 'string' && director.trim() !== '') {
      matchStage['movieData.director'] = { $regex: `^${director.trim()}$`, $options: 'i' };
  }
   // Filter by movie actor (case-insensitive exact match within the movie's actors array)
  if (actor && typeof actor === 'string' && actor.trim() !== '') {
      matchStage['movieData.actors'] = { $regex: `^${actor.trim()}$`, $options: 'i' };
  }
  // Filter by book genre (case-insensitive exact match within the book's genres array)
  if (bookGenre && typeof bookGenre === 'string' && bookGenre.trim() !== '') {
      matchStage['bookData.genres'] = { $regex: `^${bookGenre.trim()}$`, $options: 'i' };
  }
  // Filter by book author (case-insensitive exact match)
  if (author && typeof author === 'string' && author.trim() !== '') {
      matchStage['bookData.author'] = { $regex: `^${author.trim()}$`, $options: 'i' };
  }
  const isFilterApplied = Object.keys(matchStage).length > 0;

  // --- Define the base aggregation pipeline (lookup and unwind related data) ---
  const aggregationPipelineBase = [
    // Join with 'movies' collection based on 'movieRef'
    { $lookup: { from: 'movies', localField: 'movieRef', foreignField: '_id', as: 'movieData' } },
    // Deconstruct the 'movieData' array. preserveNull allows connections without movies to pass through.
    { $unwind: { path: '$movieData', preserveNullAndEmptyArrays: true } },
    // Join with 'books' collection based on 'bookRef'
    { $lookup: { from: 'books', localField: 'bookRef', foreignField: '_id', as: 'bookData' } },
    // Deconstruct the 'bookData' array. preserveNull allows connections without books to pass through.
    { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } },
    // Join with 'users' collection based on 'userRef'
    { $lookup: { from: 'users', localField: 'userRef', foreignField: '_id', as: 'userData' } },
    // Deconstruct the 'userData' array. Should always exist, but preserveNull is safe.
    { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
    // Apply the dynamic filter conditions built earlier
    { $match: matchStage }
  ];

  // --- Execute aggregation to count total matching documents (for pagination) ---
  // Add a $count stage to the base pipeline
  const countResult = await Connection.aggregate([...aggregationPipelineBase, { $count: 'totalCount' }]);
  const count = countResult.length > 0 ? countResult[0].totalCount : 0; // Extract count or default to 0

  // --- Execute aggregation to fetch the paginated and filtered connections ---
  const connections = await Connection.aggregate([
     ...aggregationPipelineBase, // Start with the base lookups and matching
     { $sort: { createdAt: -1 } }, // Sort results, newest first
     { $skip: pageSize * (page - 1) }, // Skip documents for previous pages
     { $limit: pageSize }, // Limit results to the page size
     // --- Reshape the output document ($project) ---
     { $project: {
        _id: 1, // Include connection ID
        context: 1, // Include context text
        tags: 1, // Include tags array
        likes: 1, // Include likes array (usually just the count is needed, consider $size: '$likes' if only count is needed)
        favorites: 1, // Include favorites array (consider $size if only count needed)
        createdAt: 1, // Include timestamps
        updatedAt: 1,
        screenshotUrl: 1, // Include screenshot info
        screenshotPublicId: 1,
        // Format the user reference object with selected fields
        userRef: {
             _id: '$userData._id',
             username: '$userData.username',
             profilePictureUrl: '$userData.profilePictureUrl', // Use consistent field name
             displayName: '$userData.displayName' // Include displayName
        },
        // Conditionally include the movieRef object ONLY if movieData exists and has an _id
        // This prevents sending partial/empty movieData objects if the lookup/unwind resulted in null
        movieRef: {
            $cond: {
                if: { $and: [ "$movieData", "$movieData._id" ] }, // Check if movieData is not null/empty and has _id
                then: "$movieData", // If valid, include the whole movieData object
                else: null         // Otherwise, explicitly set movieRef to null
            }
        },
        // Conditionally include the bookRef object similarly
        bookRef: {
             $cond: {
                 if: { $and: [ "$bookData", "$bookData._id" ] }, // Check if bookData is not null/empty and has _id
                 then: "$bookData", // If valid, include the whole bookData object
                 else: null        // Otherwise, explicitly set bookRef to null
             }
         }
       }
     }
     // --- *** END $project Stage *** ---
    ]);

  // --- Debug log removed ---
  // if (connections.length > 0) {
  //   console.log("[getConnections] Sample connection object being sent:", JSON.stringify(connections[0], null, 2));
  // }

  // Send the response with connections and pagination info
  res.json({
      connections,
      page,
      pages: Math.ceil(count / pageSize), // Calculate total pages
      filterApplied: isFilterApplied, // Indicate if filters were used
      activeFilters: req.query // Return the active filters for frontend state
  });
});


/**
 * @desc    Get a single connection by its ID, fully populated
 * @route   GET /api/connections/:id
 * @access  Public
 */
export const getConnectionById = asyncHandler(async (req, res) => {
    const connectionId = req.params.id;
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400);
        throw new Error('Invalid Connection ID format');
    }
    // Find the connection by ID and populate references
    const connection = await Connection.findById(connectionId)
        .populate('userRef', 'username profilePictureUrl _id displayName') // Use consistent field name
        .populate('movieRef') // Populate full movie document
        .populate('bookRef');  // Populate full book document

    if (!connection) {
        res.status(404);
        throw new Error('Connection not found');
    }
    // Send the found connection
    res.status(200).json(connection);
});


/**
 * @desc    Get popular tags based on frequency in Connections collection
 * @route   GET /api/connections/popular-tags
 * @access  Public
 */
export const getPopularTags = asyncHandler(async (req, res) => {
    const tagLimit = 15; // Max number of popular tags to return
    try {
        const popularTags = await Connection.aggregate([
            // Stage 1: Filter out connections with no tags or empty tags array
            { $match: { tags: { $exists: true, $ne: [] } } },
            // Stage 2: Deconstruct the 'tags' array into individual documents per tag
            { $unwind: '$tags' },
            // Stage 3: Convert tag to lowercase for case-insensitive grouping
            { $project: { tagLower: { $toLower: '$tags' } } },
            // Stage 4: Group by the lowercase tag and count occurrences
            { $group: { _id: '$tagLower', count: { $sum: 1 } } },
            // Stage 5: Sort by count descending (most popular first)
            { $sort: { count: -1 } },
            // Stage 6: Limit the number of results
            { $limit: tagLimit },
            // Stage 7: Reshape the output documents
            { $project: { _id: 0, tag: '$_id', count: 1 } }
        ]);
        res.json(popularTags);
    } catch (error) {
        console.error('[getPopularTags] Error fetching popular tags:', error);
        res.status(500);
        throw new Error('Server error fetching popular tags');
    }
});

/**
 * @desc    Like or Unlike a connection
 * @route   POST /api/connections/:id/like
 * @access  Private (Requires login)
 */
export const likeConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  // Ensure user is authenticated and has necessary info
  if (!req.user || !req.user._id || !req.user.username) {
      res.status(401);
      throw new Error('User not found or username missing for like action.');
  }
  const userId = req.user._id;
  const username = req.user.username; // For notification message

  // Validate connection ID format
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      res.status(400);
      throw new Error('Invalid Connection ID format');
  }

  // Find the connection to be liked/unliked
  const connection = await Connection.findById(connectionId);
  if (!connection) {
      res.status(404);
      throw new Error('Connection not found');
  }

  // Check if the user has already liked this connection
  const alreadyLiked = connection.likes.some(like => like.equals(userId));

  let updateOperation;
  let notificationShouldBeCreated = false;
  let notificationId = null; // To potentially return to the client

  // Determine the update operation (add or remove like)
  if (alreadyLiked) {
      // User already liked, so remove the like ($pull)
      updateOperation = { $pull: { likes: userId } };
  } else {
      // User hasn't liked, so add the like ($addToSet prevents duplicates)
      updateOperation = { $addToSet: { likes: userId } };
      // Create a notification only if someone *else* likes the connection
      if (!connection.userRef.equals(userId)) {
          notificationShouldBeCreated = true;
      }
  }

  // Apply the update operation to the connection
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, updateOperation, { new: true }); // `new: true` returns the updated document

  // Check if the update was successful
  if (!updatedConnectionRaw) {
      // This might happen if the connection was deleted between the findById and findByIdAndUpdate calls
      res.status(404);
      throw new Error('Connection not found after update attempt.');
  }

  // Create notification if needed
  if (notificationShouldBeCreated) {
      try {
          const notificationMessage = `${username} liked your connection.`;
          const notification = await Notification.create({
              recipientRef: connection.userRef, // The user who created the connection
              senderRef: userId, // The user who liked the connection
              type: 'LIKE',
              connectionRef: connection._id, // Link notification to the connection
              message: notificationMessage
          });
          notificationId = notification._id; // Store the ID if needed by client
      } catch (notificationError) {
          // Log error but don't fail the whole request
          console.error(`[likeConnection] Failed notification creation: ${notificationError.message}`);
      }
  }

  // Re-populate the connection to send back the full details needed by the frontend
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
        .populate('userRef', 'username profilePictureUrl _id displayName') // Use consistent field name
        .populate('movieRef')
        .populate('bookRef');

  // Send the updated connection and potentially the notification ID
  res.json({ connection: updatedConnection, notificationId });
});


/**
 * @desc    Favorite or Unfavorite a connection
 * @route   POST /api/connections/:id/favorite
 * @access  Private (Requires login)
 */
export const favoriteConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
      res.status(401);
      throw new Error('User not found for favorite action.');
  }
  const userId = req.user._id;

  // Validate connection ID format
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      res.status(400);
      throw new Error('Invalid Connection ID format');
  }

  // Find the connection
  const connection = await Connection.findById(connectionId);
  if (!connection) {
      res.status(404);
      throw new Error('Connection not found');
  }
  const connectionCreatorId = connection.userRef; // ID of the user who created the connection

  // Check if the current user has already favorited this connection
  const alreadyFavorited = connection.favorites.some(fav => fav.equals(userId));

  let connectionUpdateOperation; // Operation for the Connection document
  let userUpdateOperation;       // Operation for the User document (updating their favorites list)
  let notificationShouldBeCreated = false;

  // Determine update operations based on whether it's already favorited
  if (alreadyFavorited) {
      // Remove favorite from Connection and User
      connectionUpdateOperation = { $pull: { favorites: userId } };
      userUpdateOperation = { $pull: { favorites: connectionId } };
  } else {
      // Add favorite to Connection and User
      connectionUpdateOperation = { $addToSet: { favorites: userId } };
      userUpdateOperation = { $addToSet: { favorites: connectionId } };
      // Create notification only if someone *else* favorites the connection
      if (!connectionCreatorId.equals(userId)) {
          notificationShouldBeCreated = true;
      }
  }

  // --- Perform Updates ---
  // 1. Update the Connection document
  const updatedConnectionRaw = await Connection.findByIdAndUpdate(connectionId, connectionUpdateOperation, { new: true });
  if (!updatedConnectionRaw) {
      res.status(404); // Or 500 if unexpected
      throw new Error('Connection not found during update attempt.');
  }

  // 2. Update the User document's favorites list
  try {
      await User.findByIdAndUpdate(userId, userUpdateOperation);
  } catch (userUpdateError) {
      // Log error but don't fail the request - the primary action (updating connection) succeeded.
      // Consider potential inconsistency if this fails. Might need a transaction for atomicity if critical.
      console.error(`[favoriteConnection] FAILED to update user ${userId} favorites list:`, userUpdateError);
  }

  // 3. Create notification if needed
  if (notificationShouldBeCreated) {
      try {
          const favoriterUsername = req.user.username || 'Someone'; // Fallback username
          const notificationMessage = `${favoriterUsername} favorited your connection.`;
          await Notification.create({
              recipientRef: connectionCreatorId,
              senderRef: userId,
              type: 'FAVORITE',
              connectionRef: connection._id,
              message: notificationMessage
          });
      } catch (notificationError) {
          console.error(`[favoriteConnection] Failed notification creation for FAVORITE: ${notificationError.message}`);
      }
  }

  // --- Prepare and Send Response ---
  // Re-populate the connection to send back full details
  const updatedConnection = await Connection.findById(updatedConnectionRaw._id)
      .populate('userRef', 'username profilePictureUrl _id displayName') // Use consistent field name
      .populate('movieRef')
      .populate('bookRef');

  if (!updatedConnection) {
      // Should ideally not happen if updatedConnectionRaw was found
      res.status(500);
      throw new Error('Failed to retrieve updated connection details after favoriting.');
  }

  // Send the fully populated, updated connection object
  res.json(updatedConnection);
});

/**
 * @desc    Delete a connection
 * @route   DELETE /api/connections/:id
 * @access  Private (Owner only)
 */
export const deleteConnection = asyncHandler(async (req, res, next) => {
    const connectionId = req.params.id;
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error('User not found for delete action.');
    }
    const userId = req.user._id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
        res.status(400);
        throw new Error('Invalid Connection ID format');
    }

    // Find the connection to delete
    const connection = await Connection.findById(connectionId);
    if (!connection) {
        res.status(404);
        throw new Error('Connection not found');
    }

    // Authorization: Ensure the user deleting is the user who created it
    if (!connection.userRef.equals(userId)) {
        res.status(403); // Forbidden
        throw new Error('User not authorized to delete this connection');
    }

    // --- Cleanup Related Data ---
    // 1. Delete associated Cloudinary image (screenshot) if it exists
    const publicIdsToDelete = [ connection.screenshotPublicId ].filter(Boolean); // Filter out null/empty IDs
    if (publicIdsToDelete.length > 0) {
        try {
            // Use Cloudinary API to delete resources by public ID
            await cloudinary.api.delete_resources(publicIdsToDelete, { type: 'upload', resource_type: 'image' });
        } catch (cloudinaryError) {
            // Log warning but continue deletion process
            console.warn(`[deleteConnection] WARNING: Error deleting Cloudinary images (${publicIdsToDelete.join(', ')}):`, cloudinaryError.message);
        }
    }

    // 2. Remove this connection's ID from any user's 'favorites' list
    try {
        await User.updateMany(
            { favorites: connectionId }, // Find users who have this connection favorited
            { $pull: { favorites: connectionId } } // Remove it from their list
        );
    } catch (userUpdateError) {
        console.warn(`[deleteConnection] WARNING: Failed to remove connection ${connectionId} from users' favorites lists:`, userUpdateError);
    }

    // 3. Delete associated comments
    try {
        await Comment.deleteMany({ connection: connectionId });
    } catch(commentDeleteError) {
        console.warn(`[deleteConnection] WARNING: Failed to delete comments for connection ${connectionId}:`, commentDeleteError);
    }

    // 4. Delete associated notifications
    try {
        await Notification.deleteMany({ connectionRef: connectionId });
    } catch (notificationDeleteError) {
        console.warn(`[deleteConnection] WARNING: Failed to delete notifications for connection ${connectionId}:`, notificationDeleteError);
    }

    // --- Delete the Connection itself ---
    await Connection.deleteOne({ _id: connectionId });

    // Send success response
    res.status(200).json({ message: 'Connection deleted successfully', connectionId: connectionId });
});


/**
 * @desc    Get all connections created by a specific user
 * @route   GET /api/connections/user/:userId  (Note: Consider if this overlaps with /api/users/:userId/connections)
 * @access  Public
 */
export const getConnectionsByUserId = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400);
      throw new Error('Invalid User ID format');
  }

  // Optional: Check if user exists before querying connections
  // const userExists = await User.exists({ _id: targetUserId });
  // if (!userExists) {
  //     res.status(404); throw new Error('User not found');
  // }

  // Find connections by userRef and populate details
  const connections = await Connection.find({ userRef: targetUserId })
    .populate('userRef', 'username profilePictureUrl _id displayName') // Use consistent field name
    .populate('movieRef')
    .populate('bookRef')
    .sort({ createdAt: -1 }); // Sort newest first

  // Return connections (empty array if none found)
  res.json(connections || []);
});

/**
 * @desc    Get multiple connections by their IDs (e.g., for Favorites view)
 * @route   POST /api/connections/batch
 * @access  Private (Requires login - assumes fetching *own* favorites or similar)
 */
export const getConnectionsByIds = asyncHandler(async (req, res) => {
    const { connectionIds } = req.body;

    // Validate input: must be an array
    if (!Array.isArray(connectionIds)) {
        res.status(400);
        throw new Error('Request body must contain an array named "connectionIds".');
    }
    // If the input array is empty, return an empty array immediately
    if (connectionIds.length === 0) {
        return res.json([]);
    }

    // Filter out any invalid ObjectIDs from the input array
    const validConnectionIds = connectionIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    // If no valid IDs remain after filtering, return an empty array
    if (validConnectionIds.length === 0) {
        return res.json([]);
    }

    // Fetch connections where the _id is in the list of valid IDs
    const connections = await Connection.find({ _id: { $in: validConnectionIds } })
        .populate('userRef', 'username profilePictureUrl _id displayName') // Use consistent field name
        .populate('movieRef')
        .populate('bookRef')
        // Optionally sort, e.g., by creation date, though order might be determined by input `connectionIds` on frontend
        .sort({ createdAt: -1 });

    // Return the found connections (empty array if none matched)
    res.json(connections || []);
});
