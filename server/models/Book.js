// server/models/Book.js (UPDATED)
import mongoose from 'mongoose';

const bookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // --- NEW FIELDS for Phase 2 Filtering & Details ---
    genres: {
      type: [String],
      index: true,
      default: [],
    },
    author: {
      type: String,
      trim: true,
      index: true,
    },
    // --- Fields for Book Detail Page ---
    coverPath: { // Store the full Cloudinary URL or relative path
        type: String,
        trim: true,
        default: null,
    },
    coverPublicId: { // Store the Cloudinary public_id for deletion
        type: String,
        trim: true,
        default: null,
    },
    isbn: { // Example: Adding ISBN
        type: String,
        trim: true,
        index: true, // Optional index if you search by ISBN
    },
    publicationYear: { // Example: Adding publication year
        type: Number,
    },
    synopsis: { // Example: Adding synopsis
        type: String,
        trim: true,
    },
    // Optional: Store original source URL if scraping/importing covers
    // coverSourceUrl: {
    //     type: String,
    //     trim: true
    // }
    // --- END NEW FIELDS ---
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster title lookups (case-insensitive) - KEEP THIS
bookSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });

// Note: Indexes for genres, author, isbn are defined inline above.

const Book = mongoose.model('Book', bookSchema);

export default Book;