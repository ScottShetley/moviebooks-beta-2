// server/controllers/notificationController.js (Corrected)
import Notification from '../models/Notification.js'; // Use .js extension
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    // --- START DIAGNOSTIC LOGGING ---
    console.log('[getNotifications] Controller invoked.');
    if (req.user && req.user._id) {
        console.log(`[getNotifications] Fetching notifications for user ID: ${req.user._id}`);
    } else {
        console.error('[getNotifications] User ID not found on request!');
        res.status(401); // Unauthorized
        throw new Error('User not authenticated');
    }
    // --- END DIAGNOSTIC LOGGING ---

    try {
        const notifications = await Notification.find({
            recipientRef: req.user._id // CORRECTED: Use recipientRef from model
        })
        .populate('senderRef', 'username _id') // CORRECTED: Use senderRef from model, populate username
        .populate({
            path: 'connectionRef',
            select: 'movieRef bookRef context screenshotUrl', // CORRECTED: Use screenshotUrl (verify this field name in Connection model)
            populate: [
                { path: 'movieRef', select: 'title' },
                { path: 'bookRef', select: 'title' }
            ]
         })
        .sort({ createdAt: -1 })
        .limit(30); // Limit the number of notifications returned

        // --- START DIAGNOSTIC LOGGING ---
        console.log(`[getNotifications] Found ${notifications.length} notifications.`);
        // Optional: Log the fetched notifications if needed for deep debugging
        // if (notifications.length > 0) {
        //     console.log('[getNotifications] Notifications data:', JSON.stringify(notifications, null, 2));
        // }
        // --- END DIAGNOSTIC LOGGING ---

        res.status(200).json(notifications); // Send 200 status with data

    } catch (error) {
        // --- START DIAGNOSTIC LOGGING ---
        console.error('[getNotifications] Error fetching notifications:', error);
        // --- END DIAGNOSTIC LOGGING ---
        res.status(500); // Internal Server Error
        throw new Error('Server error fetching notifications'); // Let error handler manage response
    }
});

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notificationId = req.params.id;

    console.log(`[markNotificationAsRead] Attempting for ID: ${notificationId}, User: ${req.user?._id}`); // Logging

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        console.error('[markNotificationAsRead] Invalid ID format:', notificationId);
        res.status(400); throw new Error('Invalid Notification ID format');
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        console.error('[markNotificationAsRead] Notification not found:', notificationId);
        res.status(404); throw new Error('Notification not found');
    }

    // Ensure model uses 'recipientRef' field name
    // CORRECTED: Use recipientRef
    if (!notification.recipientRef.equals(req.user._id)) {
        console.warn(`[markNotificationAsRead] Unauthorized attempt. Notif Recipient: ${notification.recipientRef}, User: ${req.user._id}`);
        res.status(403); throw new Error('Not authorized to update this notification');
    }

    if (!notification.read) {
        notification.read = true;
        await notification.save();
        console.log(`[markNotificationAsRead] Marked notification ${notificationId} as read.`); // Logging
    } else {
        console.log(`[markNotificationAsRead] Notification ${notificationId} was already read.`); // Logging
    }

    res.status(200).json(notification); // Send 200 status with updated notification
});

// @desc    Mark all unread notifications for the user as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    // Ensure model uses 'recipientRef' field name
    // CORRECTED: Use recipientRef
    console.log(`[markAllNotificationsAsRead] Attempting for User: ${req.user?._id}`); // Logging

    const result = await Notification.updateMany(
        { recipientRef: req.user._id, read: false }, // CORRECTED: Use recipientRef
        { $set: { read: true } }
    );

    console.log(`[markAllNotificationsAsRead] Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`); // Logging

    res.status(200).json({ message: 'All notifications marked as read', count: result.modifiedCount });
});

// --- Use NAMED exports ---
export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};