// server/models/Book.js
import mongoose from 'mongoose';

const bookSchema = mongoose.Schema (
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
    author: {
      type: String,
      trim: true,
      index: true, // Index for efficient author-based filtering
    },
    // --- END NEW FIELDS ---
    // Add year later if needed
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster title lookups (case-insensitive) - KEEP THIS
bookSchema.index ({title: 1}, {collation: {locale: 'en', strength: 2}});

// Note: Indexes for genres and author are defined inline above.

const Book = mongoose.model ('Book', bookSchema);

export default Book;
