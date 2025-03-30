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
      // The movie in the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Movie', // Reference to the Movie model
    },
    bookRef: {
      // The book in the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Book', // Reference to the Book model
    },
    context: {
      // Optional text description
      type: String,
      trim: true,
    },
    // --- UPDATED IMAGE FIELDS ---
    moviePosterUrl: {
      // Cloudinary URL for the movie poster image
      type: String,
    },
    moviePosterPublicId: {
      // Cloudinary public_id for deletion
      type: String,
    },
    bookCoverUrl: {
      // Cloudinary URL for the book cover image
      type: String,
    },
    bookCoverPublicId: {
      // Cloudinary public_id for deletion
      type: String,
    },
    screenshotUrl: {
      // Cloudinary URL for the screenshot image
      type: String,
    },
    screenshotPublicId: {
      // Cloudinary public_id for deletion
      type: String,
    },
    // --- END UPDATED IMAGE FIELDS ---
    likes: [
      // Array of users who liked this
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    favorites: [
      // Array of users who favorited this
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
connectionSchema.index ({movieRef: 1}); // Finding connections by movie
connectionSchema.index ({bookRef: 1}); // Finding connections by book

const Connection = mongoose.model ('Connection', connectionSchema);

export default Connection;
