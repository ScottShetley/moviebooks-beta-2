// server/models/Connection.js
import mongoose from 'mongoose';

const connectionSchema = mongoose.Schema (
  {
    userRef: {
      // User who created the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model
    },
    movieRef: {
      // The movie in the connection (NOW OPTIONAL)
      type: mongoose.Schema.Types.ObjectId,
      // required: true, // <-- REMOVED
      ref: 'Movie', // Reference to the Movie model
      default: null, // Explicitly allow null
    },
    bookRef: {
      // The book in the connection (NOW OPTIONAL)
      type: mongoose.Schema.Types.ObjectId,
      // required: true, // <-- REMOVED
      ref: 'Book', // Reference to the Book model
      default: null, // Explicitly allow null
    },
    context: {
      // Optional text description (becomes primary for text-only posts)
      type: String,
      trim: true,
    },
    tags: {
      // Array of user-defined tags for thematic filtering
      type: [String], // Defines an array of Strings
      index: true, // Add an index for efficient tag-based searches
      default: [], // Default to an empty array
    },
    // --- Cloudinary Image Fields ---
    moviePosterUrl: { // Consider removing if always pulling from Movie ref
      type: String,
    },
    moviePosterPublicId: { // Consider removing if always pulling from Movie ref
      type: String,
    },
    bookCoverUrl: { // Consider removing if always pulling from Book ref
      type: String,
    },
    bookCoverPublicId: { // Consider removing if always pulling from Book ref
      type: String,
    },
    screenshotUrl: {
      // Cloudinary URL for the screenshot image (connection-specific)
      type: String,
    },
    screenshotPublicId: {
      // Cloudinary public_id for deletion (connection-specific)
      type: String,
    },
    // --- Engagement Fields ---
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for optimizing common queries
connectionSchema.index ({userRef: 1, createdAt: -1}); // User's connections feed
connectionSchema.index ({createdAt: -1}); // Global feed sorted by date
connectionSchema.index ({movieRef: 1}); // Finding connections by movie (sparse?)
connectionSchema.index ({bookRef: 1}); // Finding connections by book (sparse?)
// Consider adding sparse:true to movieRef/bookRef indexes if many connections will lack them
connectionSchema.index ({ tags: 1 }); // Index for 'tags' (already defined in schema)

const Connection = mongoose.model ('Connection', connectionSchema);

export default Connection;