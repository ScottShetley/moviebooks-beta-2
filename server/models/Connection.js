// server/models/Connection.js
import mongoose from 'mongoose';

/**
 * Represents a Connection, the core content type of the application.
 * A connection links a User to optionally a Movie and/or a Book,
 * includes contextual text, tags, an optional screenshot, and tracks engagement (likes, favorites).
 */
const connectionSchema = mongoose.Schema(
  {
    userRef: {
      // User who created the connection.
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model.
      index: true, // Index for fetching a user's connections.
    },
    movieRef: {
      // The movie in the connection (optional).
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie', // Reference to the Movie model.
      default: null, // Explicitly allow null for text-only or book-only connections.
      // Index defined below with sparse option.
    },
    bookRef: {
      // The book in the connection (optional).
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book', // Reference to the Book model.
      default: null, // Explicitly allow null for text-only or movie-only connections.
      // Index defined below with sparse option.
    },
    context: {
      // Optional text description provided by the user.
      // Becomes the primary content for connections without movie/book refs.
      type: String,
      trim: true,
      maxlength: [2000, 'Context cannot exceed 2000 characters.'], // Added maxlength for safety
    },
    tags: {
      // Array of user-defined tags for thematic filtering.
      type: [String],
      index: true, // Index for efficient tag-based searches (defined inline).
      default: [], // Default to an empty array.
    },
    // --- Connection-Specific Image ---
    screenshotUrl: {
      // Cloudinary URL for the optional screenshot image uploaded with the connection.
      type: String,
      trim: true,
      default: null,
    },
    screenshotPublicId: {
      // Cloudinary public_id for the screenshot, used for deletion.
      type: String,
      trim: true,
      default: null,
    },
    // --- Redundant Image Fields REMOVED ---
    // moviePosterUrl, moviePosterPublicId, bookCoverUrl, bookCoverPublicId were removed.
    // This info should be retrieved by populating movieRef and bookRef respectively.
    // Ensure controllers are updated to reflect this change.
    // --- Engagement Fields ---
    likes: [
      {
        // Array of User ObjectIds who liked this connection.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    favorites: [
      {
        // Array of User ObjectIds who favorited this connection.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically.
  }
);

// --- Indexes for Optimizing Common Queries ---

// Index for fetching a specific user's connections, sorted by date.
// (userRef: 1 is also defined inline, but compound index is good here).
connectionSchema.index({ userRef: 1, createdAt: -1 });

// Index for the global feed, sorted by date.
connectionSchema.index({ createdAt: -1 });

// Index for finding connections by movie.
// `sparse: true` ensures only connections *with* a movieRef are indexed, saving space.
connectionSchema.index({ movieRef: 1 }, { sparse: true });

// Index for finding connections by book.
// `sparse: true` ensures only connections *with* a bookRef are indexed.
connectionSchema.index({ bookRef: 1 }, { sparse: true });

// Note: `tags: 1` index is defined inline within the schema definition above.

// Create the Mongoose model from the schema.
const Connection = mongoose.model('Connection', connectionSchema);

// Export the model for use in other parts of the application.
export default Connection;
