// server/models/Movie.js
const mongoose = require('mongoose');

const movieSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Add director, year later if needed
  },
  {
    timestamps: true,
  }
);

// Index for faster title lookups (case-insensitive)
movieSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;