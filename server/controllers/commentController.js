// server/controllers/commentController.js
import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Connection from '../models/Connection.js';
// User model might be implicitly used via req.user for displayName/username
// import User from '../models/User.js'; 
import mongoose from 'mongoose';
import { generateNotification } from './notificationController.js'; // <--- IMPORTED

// @desc    Create a new comment on a connection
// @route   POST /api/connections/:id/comments <-- Route uses :id
// @access  Private (requires login)
const createComment = asyncHandler (async (req, res) => {
  const {id: connectionId} = req.params;
  const {text} = req.body;
  const userId = req.user._id; // User making the comment
  const username = req.user.displayName || req.user.username || 'A user'; // For notification message

  // 1. Validate Input (Comment Text)
  if (!text || text.trim () === '') {
    console.log ('[createComment] Text validation failed: Empty or whitespace only.');
    res.status (400);
    throw new Error ('Comment text cannot be empty.');
  }

  // 2. Validate Connection ID format
  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    console.log ('[createComment] Connection ID validation failed: Invalid format.');
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  // 3. Check if Connection exists
  const connectionExists = await Connection.findById (connectionId).populate('userRef', '_id'); // Ensure userRef is populated for owner ID
  if (!connectionExists) {
    console.log (`[createComment] Connection with ID ${connectionId} not found.`);
    res.status (404);
    throw new Error ('Connection not found.');
  }

  // 4. Create and Save Comment
  const comment = new Comment ({
    text: text.trim (),
    user: userId,
    connection: connectionId,
  });

  try {
    const createdComment = await comment.save ();
    console.log (`[createComment] Comment saved successfully with ID: ${createdComment._id}`);

    const populatedComment = await Comment.findById (
      createdComment._id
    ).populate ('user', 'username _id profilePictureUrl displayName');
    
    if (!populatedComment) {
      console.error (`[createComment] Failed to retrieve populated comment with ID: ${createdComment._id}`);
      res.status (500);
      throw new Error ('Failed to retrieve created comment after saving.');
    }

    // --- START: Notification Generation ---
    if (connectionExists.userRef && connectionExists.userRef._id) {
      const recipientId = connectionExists.userRef._id; // Owner of the connection
      
      // generateNotification will handle the self-notification check
      // (i.e., if senderId.toString() === recipientId.toString())

      const notificationMessage = `${username} commented on your connection.`;
      // Link to the connection detail page. Frontend can handle scrolling to comments if desired.
      const notificationLink = `/connections/${connectionId}`; 

      await generateNotification({
          recipient: recipientId,
          sender: userId, // User who made the comment
          type: 'comment', // Using the existing 'comment' type from Notification model
          message: notificationMessage,
          link: notificationLink,
          connectionRef: connectionId 
      });
      console.log(`[createComment] Notification generation attempted for new comment on connection ${connectionId} for recipient ${recipientId}.`);
    } else {
        console.warn(`[createComment] Could not generate notification: connection owner (userRef) not found or not populated for connection ${connectionId}.`);
    }
    // --- END: Notification Generation ---

    console.log ('[createComment] Sending 201 response with populated comment.');
    res.status (201).json (populatedComment);
  } catch (saveError) {
    console.error ('[createComment] Error saving comment to DB:', saveError);
    // Check if it's a duplicate key error or validation error from Mongoose
    if (saveError.name === 'ValidationError') {
        res.status(400); // Bad request for validation errors
    } else {
        res.status(500); // Internal server error for other save errors
    }
    throw new Error (`Failed to save comment: ${saveError.message}`);
  }
});

// @desc    Get all comments for a specific connection
// @route   GET /api/connections/:id/comments <-- Route uses :id
// @access  Public
const getCommentsForConnection = asyncHandler (async (req, res) => {
  const {id: connectionId} = req.params;

  if (!mongoose.Types.ObjectId.isValid (connectionId)) {
    console.log ('[getComments] Connection ID validation failed: Invalid format.');
    res.status (400);
    throw new Error ('Invalid Connection ID format.');
  }

  try {
    const rawComments = await Comment.find ({connection: connectionId})
      .sort ({createdAt: 1}) 
      .lean (); 

    console.log ('[getCommentsForConnection] Raw comments data (before population):', JSON.stringify (rawComments, null, 2));
    
    const comments = await Comment.populate (rawComments, {
      path: 'user',
      select: 'username _id profilePictureUrl displayName', 
    });

    console.log ('[getCommentsForConnection] Data being sent to frontend (after population):', JSON.stringify (comments, null, 2));
    
    console.log (`[getComments] Found ${comments.length} comments for connection ID: ${connectionId}. Sending 200 response.`);
    res.status (200).json (comments);
  } catch (fetchError) {
    console.error ('[getComments] Error fetching comments from DB:', fetchError);
    res.status (500);
    throw new Error ('Failed to fetch comments.');
  }
});

// @desc    Update a specific comment by ID
// @route   PUT /api/comments/:id <-- Route uses :id (referring to comment ID)
// @access  Private (Author only)
const updateComment = asyncHandler (async (req, res) => {
  const {id: commentId} = req.params;
  const {text} = req.body;
  const userId = req.user._id;

  if (!text || text.trim () === '') {
    console.log (`[updateComment] Text validation failed for comment ID ${commentId}: Empty or whitespace only.`);
    res.status (400);
    throw new Error ('Comment text cannot be empty.');
  }

  if (!mongoose.Types.ObjectId.isValid (commentId)) {
    console.log (`[updateComment] Comment ID validation failed: Invalid format for ID ${commentId}.`);
    res.status (400);
    throw new Error ('Invalid Comment ID format.');
  }

  const comment = await Comment.findById (commentId);

  if (!comment) {
    console.log (`[updateComment] Comment with ID ${commentId} not found.`);
    res.status (404);
    throw new Error ('Comment not found.');
  }

  if (comment.user.toString () !== userId.toString ()) {
    console.warn (`[updateComment] Authorization failed for comment ID ${commentId}. User ${userId} is not the author ${comment.user}.`);
    res.status (401); 
    throw new Error ('Not authorized to update this comment.');
  }

  comment.text = text.trim ();

  try {
    const updatedComment = await comment.save ();
    console.log (`[updateComment] Comment ID ${updatedComment._id} updated successfully.`);

    const populatedUpdatedComment = await Comment.findById (
      updatedComment._id
    ).populate ('user', 'username _id profilePictureUrl displayName'); 

    if (!populatedUpdatedComment) {
      console.error (`[updateComment] Failed to retrieve populated updated comment with ID: ${updatedComment._id}`);
      res.status (500);
      throw new Error ('Failed to retrieve updated comment after saving.');
    }

    console.log (`[updateComment] Sending 200 response with populated updated comment ID: ${populatedUpdatedComment._id}.`);
    res.status (200).json (populatedUpdatedComment);
  } catch (saveError) {
    console.error (`[updateComment] Error saving updated comment ID ${commentId} to DB:`, saveError);
    if (saveError.name === 'ValidationError') {
        res.status(400);
    } else {
        res.status(500);
    }
    throw new Error (`Failed to save updated comment: ${saveError.message}`);
  }
});

// @desc    Delete a specific comment by ID
// @route   DELETE /api/comments/:id <-- Route uses :id (referring to comment ID)
// @access  Private (Author only)
const deleteComment = asyncHandler (async (req, res) => {
  const {id: commentId} = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid (commentId)) {
    console.log (`[deleteComment] Comment ID validation failed: Invalid format for ID ${commentId}.`);
    res.status (400);
    throw new Error ('Invalid Comment ID format.');
  }

  const comment = await Comment.findById (commentId);

  if (!comment) {
    console.log (`[deleteComment] Comment with ID ${commentId} not found.`);
    res.status (404);
    throw new Error ('Comment not found.');
  }

  if (comment.user.toString () !== userId.toString ()) {
    console.warn (`[deleteComment] Authorization failed for comment ID ${commentId}. User ${userId} is not the author ${comment.user}.`);
    res.status (401); 
    throw new Error ('Not authorized to delete this comment.');
  }

  try {
    await comment.deleteOne (); 
    console.log (`[deleteComment] Comment ID ${commentId} deleted successfully.`);
    res.status (200).json ({message: 'Comment removed'});
  } catch (deleteError) {
    console.error (`[deleteComment] Error deleting comment ID ${commentId} from DB:`, deleteError);
    res.status (500);
    throw new Error ('Failed to delete comment.');
  }
});

export {createComment, getCommentsForConnection, updateComment, deleteComment};