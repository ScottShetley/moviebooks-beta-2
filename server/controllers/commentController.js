// server/controllers/commentController.js
import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js'; // Keep User import though not directly used in new functions yet
import mongoose from 'mongoose';

// @desc    Create a new comment on a connection
// @route   POST /api/connections/:id/comments <-- Route uses :id
// @access  Private (requires login)
const createComment = asyncHandler (async (req, res) => {
  // Extract 'id' from params and alias to connectionId
  const {id: connectionId} = req.params;
  // Extract 'text' from the request body
  const {text} = req.body;
  // Get user ID from the authenticated user via authMiddleware
  const userId = req.user._id;

  // --- DEBUG LOGS ---
  // console.log ('[createComment] Received connectionId param:', connectionId);
  // console.log ('[createComment] Type of connectionId:', typeof connectionId);
  // console.log ('[createComment] isValid ObjectId check result for connectionId:', mongoose.Types.ObjectId.isValid (connectionId));
  // console.log ('[createComment] Received text:', text);
  // console.log ('[createComment] Trimmed text length:', text?.trim().length);
  // --- END DEBUG LOGS ---

  // 1. Validate Input (Comment Text)
  if (!text || text.trim () === '') {
    console.log (
      '[createComment] Text validation failed: Empty or whitespace only.'
    );
    res.status (400);
    throw new Error ('Comment text cannot be empty.');
  }

  // 2. Validate Connection ID format
  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    console.log (
      '[createComment] Connection ID validation failed: Invalid format.'
    );
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  // 3. Check if Connection exists (Optional but good practice)
  // Although strictly not necessary for creating the comment document,
  // ensuring the parent connection exists prevents orphaned comments.
  const connectionExists = await Connection.findById (connectionId);
  if (!connectionExists) {
    console.log (
      `[createComment] Connection with ID ${connectionId} not found.`
    );
    res.status (404);
    throw new Error ('Connection not found.');
  }

  // 4. Create and Save Comment
  const comment = new Comment ({
    text: text.trim (), // Store the trimmed text
    user: userId,
    connection: connectionId, // Use the validated connectionId
  });

  try {
    const createdComment = await comment.save ();
    console.log (
      `[createComment] Comment saved successfully with ID: ${createdComment._id}`
    );

    // 5. Populate user details for the response
    // Populate the comment after saving to include user info in the response
    const populatedComment = await Comment.findById (
      createdComment._id
    ).populate ('user', 'username _id profilePictureUrl displayName'); // <-- CORRECTED FIELD NAME
    if (!populatedComment) {
      console.error (
        `[createComment] Failed to retrieve populated comment with ID: ${createdComment._id}`
      );
      // This is an internal server error, the comment was saved but population failed somehow
      res.status (500);
      throw new Error ('Failed to retrieve created comment after saving.');
    }

    console.log (
      '[createComment] Sending 201 response with populated comment.'
    );
    res.status (201).json (populatedComment);
  } catch (saveError) {
    console.error ('[createComment] Error saving comment to DB:', saveError);
    res.status (500); // Use 500 for database save errors
    throw new Error ('Failed to save comment.');
  }
});

// @desc    Get all comments for a specific connection
// @route   GET /api/connections/:id/comments <-- Route uses :id
// @access  Public
const getCommentsForConnection = asyncHandler (async (req, res) => {
  // Extract 'id' from params and alias to connectionId
  const {id: connectionId} = req.params;

  // --- DEBUG LOGS ---
  // console.log ('[getComments] Received connectionId param:', connectionId);
  // console.log ('[getComments] Type of connectionId:', typeof connectionId);
  // console.log ('[getComments] isValid ObjectId check result for connectionId:', mongoose.Types.ObjectId.isValid (connectionId));
  // --- END DEBUG LOGS ---

  // Validate the extracted connectionId
  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    console.log (
      '[getComments] Connection ID validation failed: Invalid format.'
    );
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  try {
    // Fetch comments using the validated connectionId
    const rawComments = await Comment.find ({connection: connectionId})
      .sort ({createdAt: 1}) // Sort ascending for discussion flow (oldest first)
      .lean (); // Add .lean() to get plain JavaScript objects for easier logging before population

    // --- NEW CONSOLE LOG: Log raw comments data BEFORE population ---
    console.log (
      '[getCommentsForConnection] Raw comments data (before population):',
      JSON.stringify (rawComments, null, 2)
    );
    // --- END NEW CONSOLE LOG ---

    // Populate user details for the comments
    const comments = await Comment.populate (rawComments, {
      // Populate the raw comments
      path: 'user',
      select: 'username _id profilePictureUrl displayName', // <-- CORRECTED FIELD NAME, used in populate options
    });

    // --- EXISTING CONSOLE LOG: Log comments data AFTER population ---
    console.log (
      '[getCommentsForConnection] Data being sent to frontend (after population):',
      JSON.stringify (comments, null, 2)
    );
    // --- END EXISTING CONSOLE LOG ---

    console.log (
      `[getComments] Found ${comments.length} comments for connection ID: ${connectionId}. Sending 200 response.`
    );
    res.status (200).json (comments);
  } catch (fetchError) {
    console.error (
      '[getComments] Error fetching comments from DB:',
      fetchError
    );
    res.status (500);
    throw new Error ('Failed to fetch comments.');
  }
});

// --- NEW: Update a comment ---
// @desc    Update a specific comment by ID
// @route   PUT /api/comments/:id <-- Route uses :id (referring to comment ID)
// @access  Private (Author only)
const updateComment = asyncHandler (async (req, res) => {
  // Extract 'id' from params and alias to commentId
  const {id: commentId} = req.params;
  // Extract 'text' from the request body (the new comment text)
  const {text} = req.body;
  // Get user ID from the authenticated user via authMiddleware
  const userId = req.user._id;

  // 1. Validate Input (Comment Text)
  if (!text || text.trim () === '') {
    console.log (
      `[updateComment] Text validation failed for comment ID ${commentId}: Empty or whitespace only.`
    );
    res.status (400);
    throw new Error ('Comment text cannot be empty.');
  }

  // 2. Validate Comment ID format
  if (!mongoose.Types.ObjectId.isValid (commentId)) {
    console.log (
      `[updateComment] Comment ID validation failed: Invalid format for ID ${commentId}.`
    );
    res.status (400);
    throw new Error ('Invalid Comment ID format.');
  }

  // 3. Find the comment
  const comment = await Comment.findById (commentId);

  // 4. Check if comment exists
  if (!comment) {
    console.log (`[updateComment] Comment with ID ${commentId} not found.`);
    res.status (404);
    throw new Error ('Comment not found.');
  }

  // 5. Authorization Check: Ensure user is the comment author
  // Convert comment.user to string for strict comparison
  if (comment.user.toString () !== userId.toString ()) {
    console.warn (
      `[updateComment] Authorization failed for comment ID ${commentId}. User ${userId} is not the author ${comment.user}.`
    );
    res.status (401); // Unauthorized
    throw new Error ('Not authorized to update this comment.');
  }

  // 6. Update and Save
  comment.text = text.trim ();

  try {
    const updatedComment = await comment.save ();
    console.log (
      `[updateComment] Comment ID ${updatedComment._id} updated successfully.`
    );

    // 7. Populate user details for the response
    const populatedUpdatedComment = await Comment.findById (
      updatedComment._id
    ).populate ('user', 'username _id profilePictureUrl displayName'); // <-- CORRECTED FIELD NAME

    if (!populatedUpdatedComment) {
      console.error (
        `[updateComment] Failed to retrieve populated updated comment with ID: ${updatedComment._id}`
      );
      res.status (500);
      throw new Error ('Failed to retrieve updated comment after saving.');
    }

    console.log (
      `[updateComment] Sending 200 response with populated updated comment ID: ${populatedUpdatedComment._id}.`
    );
    res.status (200).json (populatedUpdatedComment);
  } catch (saveError) {
    console.error (
      `[updateComment] Error saving updated comment ID ${commentId} to DB:`,
      saveError
    );
    res.status (500);
    throw new Error ('Failed to save updated comment.');
  }
});

// --- NEW: Delete a comment ---
// @desc    Delete a specific comment by ID
// @route   DELETE /api/comments/:id <-- Route uses :id (referring to comment ID)
// @access  Private (Author only)
const deleteComment = asyncHandler (async (req, res) => {
  // Extract 'id' from params and alias to commentId
  const {id: commentId} = req.params;
  // Get user ID from the authenticated user via authMiddleware
  const userId = req.user._id;

  // 1. Validate Comment ID format
  if (!mongoose.Types.ObjectId.isValid (commentId)) {
    console.log (
      `[deleteComment] Comment ID validation failed: Invalid format for ID ${commentId}.`
    );
    res.status (400);
    throw new Error ('Invalid Comment ID format.');
  }

  // 2. Find the comment
  const comment = await Comment.findById (commentId);

  // 3. Check if comment exists
  if (!comment) {
    console.log (`[deleteComment] Comment with ID ${commentId} not found.`);
    res.status (404);
    throw new Error ('Comment not found.');
  }

  // 4. Authorization Check: Ensure user is the comment author
  // Convert comment.user to string for strict comparison
  if (comment.user.toString () !== userId.toString ()) {
    console.warn (
      `[deleteComment] Authorization failed for comment ID ${commentId}. User ${userId} is not the author ${comment.user}.`
    );
    res.status (401); // Unauthorized
    throw new Error ('Not authorized to delete this comment.');
  }

  // 5. Delete the comment
  try {
    await comment.deleteOne (); // Using deleteOne() on the found document
    console.log (
      `[deleteComment] Comment ID ${commentId} deleted successfully.`
    );
    res.status (200).json ({message: 'Comment removed'});
  } catch (deleteError) {
    console.error (
      `[deleteComment] Error deleting comment ID ${commentId} from DB:`,
      deleteError
    );
    res.status (500);
    throw new Error ('Failed to delete comment.');
  }
});

// --- Update exports to include the new functions ---
// <-- NEW
// <-- NEW
export {createComment, getCommentsForConnection, updateComment, deleteComment};
