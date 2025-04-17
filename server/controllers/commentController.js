// server/controllers/commentController.js
import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Connection from '../models/Connection.js';
// User model is imported but only used via populate, which is fine.
// import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Create a new comment on a connection
// @route   POST /api/connections/:id/comments
// @access  Private (requires login)
const createComment = asyncHandler(async (req, res) => {
  // Extract 'id' from route parameters and rename it to connectionId for clarity.
  const { id: connectionId } = req.params;
  const { text } = req.body;
  const userId = req.user._id; // Assumes authMiddleware provides req.user

  // --- Debug logs removed ---

  // 1. Validate Input
  // Ensure comment text is provided and not just whitespace.
  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Comment text cannot be empty.');
  }
  // Validate if the provided connection ID is a valid MongoDB ObjectId format.
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    res.status(400);
    throw new Error('Invalid Connection ID format.');
  }

  // 2. Check if the target Connection exists
  // Prevents creating comments orphaned from a non-existent connection.
  const connectionExists = await Connection.findById(connectionId);
  if (!connectionExists) {
    res.status(404);
    throw new Error('Connection not found.');
  }

  // 3. Create and Save Comment
  const comment = new Comment({
    text: text.trim(), // Store trimmed text
    user: userId, // Reference to the user who commented
    connection: connectionId, // Reference to the connection being commented on
  });
  const createdComment = await comment.save();

  // 4. Populate user details for the response
  // Fetch the newly created comment again, replacing the 'user' ID with selected fields from the User document.
  const populatedComment = await Comment.findById(createdComment._id).populate(
    'user', // Field in the Comment model to populate
    'username _id' // Fields to select from the referenced User document
  );

  // Handle rare case where population fails immediately after creation
  if (!populatedComment) {
    console.error(`[createComment] Failed to populate comment ${createdComment._id} immediately after creation.`); // Keep this error log
    res.status(500);
    throw new Error('Failed to retrieve created comment after saving.');
  }

  // Respond with the newly created and populated comment.
  res.status(201).json(populatedComment);
});

// @desc    Get all comments for a specific connection
// @route   GET /api/connections/:id/comments
// @access  Public
const getCommentsForConnection = asyncHandler(async (req, res) => {
  // Extract 'id' from route parameters and rename it to connectionId.
  const { id: connectionId } = req.params;

  // --- Debug logs removed ---

  // Validate if the provided connection ID is a valid MongoDB ObjectId format.
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    res.status(400);
    throw new Error('Invalid Connection ID format.');
  }

  // Fetch all comments associated with the validated connectionId.
  const comments = await Comment.find({ connection: connectionId })
    // Populate the 'user' field with specific details from the User model.
    .populate('user', 'username _id')
    // Sort comments by creation date, newest first.
    .sort({ createdAt: -1 });

  // Respond with the array of comments (will be empty if none found).
  res.status(200).json(comments);
});

// Export the controller functions for use in route definitions.
export { createComment, getCommentsForConnection };
