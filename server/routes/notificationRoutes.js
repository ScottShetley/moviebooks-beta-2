// server/routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js'; // All notification routes require login

/**
 * Defines routes related to fetching and managing user notifications.
 * Base Path: /api/notifications (mounted in server.js or app.js)
 */
const router = express.Router(); // Consistent spacing

// --- Routes for '/api/notifications' ---

// GET /api/notifications: Get notifications for the logged-in user (Private)
router.route('/').get(protect, getNotifications); // Consistent spacing

// PATCH /api/notifications/read-all: Mark all notifications as read (Private)
// Using PATCH as it modifies the state of multiple resources
router.route('/read-all').patch(protect, markAllNotificationsAsRead); // Consistent spacing

// PATCH /api/notifications/:id/read: Mark a specific notification as read (Private)
// Using PATCH as it modifies the state of a single resource
router.route('/:id/read').patch(protect, markNotificationAsRead); // Consistent spacing

// Export the router instance for mounting in the main application file.
export default router;
