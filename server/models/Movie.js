// server/models/Movie.js
import mongoose from 'mongoose';

/**
 * Represents a Movie in the database.
 * Stores metadata about a movie, including title, director, actors, genres, poster image details,
 * release year, and synopsis. Referenced by Connection documents.
 */
const movieSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Title is mandatory for a movie entry.
      trim: true,     // Remove leading/trailing whitespace.
    },
    // --- Fields for Filtering & Details ---
    genres: {
      type: [String], // Array of genre strings.
      index: true,    // Index for efficient genre-based filtering.
      default: [],    // Default to an empty array if not provided.
    },
    director: {
      type: String,
      trim: true,
      index: true,    // Index for efficient director-based filtering.
    },
    actors: {
      type: [String], // Array of actor names.
      index: true,    // Index for efficient actor-based filtering.
      default: [],    // Default to an empty array if not provided.
    },
    year: { // Year the movie was released.
      type: Number,
    },
    // --- Fields for Movie Detail Page & Display ---
    posterPath: { // Store the full Cloudinary URL for the movie poster.
      type: String,
      trim: true,
      default: null, // Use null to clearly indicate no poster image is set.
    },
    posterPublicId: { // Store the Cloudinary public_id for potential deletion/management.
      type: String,
      trim: true,
      default: null, // Use null to clearly indicate no poster image is set.
    },
    synopsis: { // A brief summary or description of the movie.
      type: String,
      trim: true,
    },
    // --- END FIELDS ---
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically.
  }
);

// --- Indexes ---
// Index for faster title lookups, ignoring case and diacritics (e.g., 'resume' matches 'résumé').
// 'strength: 2' provides case-insensitivity.
movieSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });

// Note: Indexes for genres, director, and actors are defined inline within the schema definition above.

// Create the Mongoose model from the schema.
const Movie = mongoose.model('Movie', movieSchema);

// Export the model for use in other parts of the application.
export default Movie;
