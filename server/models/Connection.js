// server/models/Connection.js
const mongoose = require('mongoose');

const connectionSchema = mongoose.Schema(
  {
    userRef: { // User who created the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model
    },
    movieRef: { // The movie in the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Movie', // Reference to the Movie model
    },
    bookRef: { // The book in the connection
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Book', // Reference to the Book model
    },
    context: { // Optional text description
      type: String,
      trim: true,
    },
    // --- UPDATED IMAGE FIELDS ---
    moviePosterUrl: { // Optional path/URL to the movie poster image
      type: String,
    },
    bookCoverUrl: {   // Optional path/URL to the book cover image
      type: String,
    },
    screenshotUrl: {  // Optional path/URL to the screenshot image
      type: String,
    },
    // --- END UPDATED IMAGE FIELDS ---
    likes: [ // Array of users who liked this
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    favorites: [ // Array of users who favorited this
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
connectionSchema.index({ userRef: 1, createdAt: -1 }); // User's connections feed
connectionSchema.index({ createdAt: -1 });             // Global feed sorted by date
connectionSchema.index({ movieRef: 1 });                // Finding connections by movie
connectionSchema.index({ bookRef: 1 });                 // Finding connections by book

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;