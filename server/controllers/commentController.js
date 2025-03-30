// server/controllers/commentController.js
import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Create a new comment on a connection
// @route   POST /api/connections/:id/comments <-- Route uses :id
// @access  Private (requires login)
const createComment = asyncHandler (async (req, res) => {
  // --- FIX: Extract 'id' from params and alias to connectionId ---
  const {id: connectionId} = req.params;
  const {text} = req.body;
  const userId = req.user._id; // From authMiddleware

  // --- DEBUG LOG ---
  console.log ('[createComment] Received connectionId param:', connectionId);
  console.log ('[createComment] Type of connectionId:', typeof connectionId);
  console.log (
    '[createComment] isValid check result:',
    mongoose.Types.ObjectId.isValid (connectionId)
  );
  // --- END DEBUG LOG ---

  // 1. Validate Input
  if (!text || text.trim () === '') {
    res.status (400);
    throw new Error ('Comment text cannot be empty.');
  }
  // --- FIX: Validate the extracted connectionId ---
  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  // 2. Check if Connection exists
  const connectionExists = await Connection.findById (connectionId);
  if (!connectionExists) {
    res.status (404);
    throw new Error ('Connection not found.');
  }

  // 3. Create and Save Comment
  const comment = new Comment ({
    text: text.trim (),
    user: userId,
    connection: connectionId, // Use the validated connectionId
  });
  const createdComment = await comment.save ();

  // 4. Populate user details
  const populatedComment = await Comment.findById (
    createdComment._id
  ).populate ('user', 'username _id');
  if (!populatedComment) {
    res.status (500);
    throw new Error ('Failed to retrieve created comment after saving.');
  }

  res.status (201).json (populatedComment);
});

// @desc    Get all comments for a specific connection
// @route   GET /api/connections/:id/comments <-- Route uses :id
// @access  Public
const getCommentsForConnection = asyncHandler (async (req, res) => {
  // --- FIX: Extract 'id' from params and alias to connectionId ---
  const {id: connectionId} = req.params;

  // --- ADD BACKEND DEBUG LOG ---
  console.log ('[getComments] Received connectionId param:', connectionId);
  console.log ('[getComments] Type of connectionId:', typeof connectionId);
  console.log (
    '[getComments] isValid check result:',
    mongoose.Types.ObjectId.isValid (connectionId)
  );
  // --- END BACKEND DEBUG LOG ---

  // --- FIX: Validate the extracted connectionId ---
  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  // Fetch comments using the validated connectionId
  const comments = await Comment.find ({connection: connectionId})
    .populate ('user', 'username _id')
    .sort ({createdAt: -1});

  res.status (200).json (comments);
});

export {createComment, getCommentsForConnection};
