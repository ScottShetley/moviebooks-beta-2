// server/models/Movie.js
import mongoose from 'mongoose';

const movieSchema = mongoose.Schema (
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // --- NEW FIELDS for Phase 2 Filtering ---
    genres: {
      type: [String], // Array of Strings
      index: true, // Index for efficient genre-based filtering
      default: [],
    },
    director: {
      type: String,
      trim: true,
      index: true, // Index for efficient director-based filtering
    },
    actors: {
      type: [String], // Array of Strings
      index: true, // Index for efficient actor-based filtering
      default: [],
    },
    // --- END NEW FIELDS ---
    // Add year later if needed
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster title lookups (case-insensitive) - KEEP THIS
movieSchema.index ({title: 1}, {collation: {locale: 'en', strength: 2}});

// Note: Indexes for genres, director, actors are defined inline above.

const Movie = mongoose.model ('Movie', movieSchema);

export default Movie;
