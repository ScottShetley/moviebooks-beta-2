// server/models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Comment text is required.'],
            trim: true,
            maxlength: [1000, 'Comment cannot be more than 1000 characters long.'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // Added index based on potential need
        },
        connection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Connection',
            required: true,
            // Index below handles querying by connection efficiently
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Index for efficient fetching of comments for a specific connection, sorted by newest first
commentSchema.index({ connection: 1, createdAt: -1 });

// Consider compound index if frequently querying comments by user AND connection
// commentSchema.index({ user: 1, connection: 1 }); // Example if needed later

// --- Pre-save/remove hooks (Optional - for updating comment counts later) ---
// We might add hooks here later if we decide to store comment counts directly
// on the Connection model for performance optimization. For now, we'll omit them.

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;