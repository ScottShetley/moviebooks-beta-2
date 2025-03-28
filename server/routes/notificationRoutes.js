// server/routes/notificationRoutes.js
const express = require('express');
const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // All notification routes require login

const router = express.Router();

// --- Routes for '/api/notifications' ---

// GET /api/notifications: Get notifications for the logged-in user (Private)
router.route('/')
    .get(protect, getNotifications);

// PATCH /api/notifications/read-all: Mark all notifications as read (Private)
// Using PATCH as it modifies the state of multiple resources
router.route('/read-all')
    .patch(protect, markAllNotificationsAsRead);

// PATCH /api/notifications/:id/read: Mark a specific notification as read (Private)
// Using PATCH as it modifies the state of a single resource
router.route('/:id/read')
    .patch(protect, markNotificationAsRead);

module.exports = router;