// server/models/Movie.js (UPDATED)
import mongoose from 'mongoose';

const movieSchema = mongoose.Schema (
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    genres: {
      type: [String],
      index: true,
      default: [],
    },
    director: {
      type: String,
      trim: true,
      index: true,
    },
    actors: {
      type: [String],
      index: true,
      default: [],
    },
    // --- NEW FIELDS ---
    posterPath: { // Store the full Cloudinary URL or relative path depending on your setup
        type: String,
        trim: true,
        default: null, // Or default: ''
    },
    posterPublicId: { // Store the Cloudinary public_id for deletion
        type: String,
        trim: true,
        default: null,
    },
    // --- END NEW FIELDS ---
    // Add year later if needed
    year: { // Example: Adding year if you plan to
        type: Number,
        // required: false // Adjust as needed
    },
    synopsis: { // Example: Adding synopsis
        type: String,
        trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes (Keep existing)
movieSchema.index ({title: 1}, {collation: {locale: 'en', strength: 2}});

const Movie = mongoose.model ('Movie', movieSchema);

export default Movie;