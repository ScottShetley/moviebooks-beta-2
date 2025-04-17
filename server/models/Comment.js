// server/models/Comment.js
import mongoose from 'mongoose';

/**
 * Represents a Comment made by a User on a Connection.
 * Stores the comment text and references to the author (User) and the
 * Connection it belongs to.
 */
const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Comment text is required.'],
            trim: true, // Remove leading/trailing whitespace.
            maxlength: [1000, 'Comment cannot be more than 1000 characters long.'],
        },
        user: {
            // The user who authored the comment.
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // Index for potential queries fetching all comments by a specific user.
        },
        connection: {
            // The connection this comment is associated with.
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Connection',
            required: true,
            // The compound index below handles querying by connection efficiently.
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically.
    }
);

// --- Indexes ---

// Primary index for efficient fetching of comments for a specific connection, sorted by newest first.
// This is expected to be the most common query pattern.
commentSchema.index({ connection: 1, createdAt: -1 });

// Consider compound index if frequently querying comments by user AND connection
// commentSchema.index({ user: 1, connection: 1 }); // Example if needed later

// --- Pre-save/remove hooks (Optional - for updating comment counts later) ---
// We might add hooks here later if we decide to store comment counts directly
// on the Connection model for performance optimization. For now, we'll omit them.
// Example:
// commentSchema.post('save', async function(doc) { /* Increment count on Connection */ });
// commentSchema.post('remove', async function(doc) { /* Decrement count on Connection */ });

// Create the Mongoose model from the schema.
const Comment = mongoose.model('Comment', commentSchema);

// Export the model for use in other parts of the application.
export default Comment;
