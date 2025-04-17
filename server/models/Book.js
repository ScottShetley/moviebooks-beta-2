// server/models/Book.js
import mongoose from 'mongoose';

/**
 * Represents a Book in the database.
 * Stores metadata about a book, including title, author, genres, cover image details,
 * and other descriptive information. Referenced by Connection documents.
 */
const bookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Title is mandatory for a book entry.
      trim: true,     // Remove leading/trailing whitespace.
    },
    // --- Fields for Filtering & Details ---
    genres: {
      type: [String], // Array of genre strings.
      index: true,    // Index for efficient genre-based filtering.
      default: [],    // Default to an empty array if not provided.
    },
    author: {
      type: String,
      trim: true,
      index: true,    // Index for efficient author-based filtering.
    },
    // --- Fields for Book Detail Page & Display ---
    coverPath: { // Store the full Cloudinary URL for the book cover.
        type: String,
        trim: true,
        default: null, // Use null to clearly indicate no cover image is set.
    },
    coverPublicId: { // Store the Cloudinary public_id for potential deletion/management.
        type: String,
        trim: true,
        default: null, // Use null to clearly indicate no cover image is set.
    },
    isbn: { // International Standard Book Number.
        type: String,
        trim: true,
        index: true, // Optional index if searching/lookup by ISBN is frequent.
    },
    publicationYear: { // Year the book was published.
        type: Number,
    },
    synopsis: { // A brief summary or description of the book.
        type: String,
        trim: true,
    },
    // Optional: Store original source URL if scraping/importing covers
    // coverSourceUrl: {
    //     type: String,
    //     trim: true
    // }
    // --- END FIELDS ---
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically.
  }
);

// --- Indexes ---
// Index for faster title lookups, ignoring case and diacritics (e.g., 'resume' matches 'résumé').
// 'strength: 2' provides case-insensitivity.
bookSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });

// Note: Indexes for genres, author, isbn are defined inline within the schema definition above.

// Create the Mongoose model from the schema.
const Book = mongoose.model('Book', bookSchema);

// Export the model for use in other parts of the application.
export default Book;
