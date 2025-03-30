// server/models/Book.js
import mongoose from 'mongoose';

const bookSchema = mongoose.Schema (
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Add author, year later if needed
  },
  {
    timestamps: true,
  }
);

// Index for faster title lookups (case-insensitive)
bookSchema.index ({title: 1}, {collation: {locale: 'en', strength: 2}});

const Book = mongoose.model ('Book', bookSchema);

export default Book;
