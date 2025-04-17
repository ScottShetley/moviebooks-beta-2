// server/controllers/notificationController.js
import Notification from '../models/Notification.js'; // Use .js extension
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    // Ensure user is authenticated (primary check should be middleware)
    if (!req.user || !req.user._id) {
        // This case should ideally be prevented by the 'protect' middleware
        res.status(401); // Unauthorized
        throw new Error('User not authenticated');
    }
    const userId = req.user._id;

    try {
        // Fetch notifications intended for the currently logged-in user.
        const notifications = await Notification.find({ recipientRef: userId })
            // Populate the sender's details (username and ID).
            .populate('senderRef', 'username _id')
            // Populate details from the related connection.
            .populate({
                path: 'connectionRef', // The field in Notification model linking to Connection
                // Select specific fields from the Connection document.
                select: 'movieRef bookRef context screenshotUrl', // Verify 'screenshotUrl' exists in Connection model
                // Further populate references within the Connection document.
                populate: [
                    { path: 'movieRef', select: 'title _id' }, // Get title and ID from the linked Movie
                    { path: 'bookRef', select: 'title _id' }  // Get title and ID from the linked Book
                ]
             })
            .sort({ createdAt: -1 }) // Show newest notifications first.
            .limit(30); // Limit the number of notifications returned for performance.

        res.status(200).json(notifications); // Send the list of notifications.

    } catch (error) {
        // Log unexpected errors during fetch operation.
        console.error('[getNotifications] Error fetching notifications:', error);
        res.status(500); // Internal Server Error
        throw new Error('Server error fetching notifications'); // Let global error handler manage response
    }
});

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user._id; // Assumes auth middleware provides req.user

    // Validate the notification ID format.
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        res.status(400); throw new Error('Invalid Notification ID format');
    }

    // Find the notification by its ID.
    const notification = await Notification.findById(notificationId);

    // Handle case where notification doesn't exist.
    if (!notification) {
        res.status(404); throw new Error('Notification not found');
    }

    // Authorization check: Ensure the notification belongs to the logged-in user.
    if (!notification.recipientRef.equals(userId)) {
        // Log potential security issue: User trying to access another user's notification.
        console.warn(`[markNotificationAsRead] Unauthorized attempt. Notif Recipient: ${notification.recipientRef}, User: ${userId}`);
        res.status(403); throw new Error('Not authorized to update this notification');
    }

    // Only update if the notification is currently unread to avoid unnecessary DB writes.
    if (!notification.read) {
        notification.read = true;
        await notification.save();
    }

    // Return the updated (or unchanged if already read) notification.
    res.status(200).json(notification);
});

// @desc    Mark all unread notifications for the user as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assumes auth middleware provides req.user

    // Use updateMany to efficiently update all matching documents.
    // Find all notifications for the user that are currently unread.
    const result = await Notification.updateMany(
        { recipientRef: userId, read: false },
        { $set: { read: true } } // Set the 'read' field to true.
    );

    // Respond with success message and the count of notifications updated.
    res.status(200).json({
        message: 'All unread notifications marked as read',
        count: result.modifiedCount // Number of documents actually modified.
    });
});

// --- Use NAMED exports ---
export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
