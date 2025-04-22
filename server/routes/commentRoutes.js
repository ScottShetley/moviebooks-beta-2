// server/routes/commentRoutes.js
import express from 'express';
const router = express.Router();
// Import protect middleware (assuming it's needed for editing/deleting)
import { protect } from '../middleware/authMiddleware.js'; // Adjust path if necessary

// Import the new controller functions (will be added in the next step)
import { updateComment, deleteComment } from '../controllers/commentController.js'; // These functions don't exist yet

// Define routes for individual comments using :commentId param
// Both require authentication (protect middleware)
router.route('/:id') // Use ':id' here to match the parameter name commonly used in controllers
    .put(protect, updateComment) // Route for updating a comment by ID
    .delete(protect, deleteComment); // Route for deleting a comment by ID


export default router;