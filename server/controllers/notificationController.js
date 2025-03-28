// server/controllers/notificationController.js
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
    try {
        // Find notifications where the recipient is the logged-in user
        const notifications = await Notification.find({ recipientRef: req.user._id })
            .populate('senderRef', 'email _id') // Populate sender's email and ID
            .populate({ // Populate the associated connection and its nested movie/book titles
                path: 'connectionRef',
                select: 'movieRef bookRef context screenshotUrl', // Select fields from Connection
                populate: [
                    { path: 'movieRef', select: 'title' }, // Select title from Movie
                    { path: 'bookRef', select: 'title' }  // Select title from Book
                ]
             })
            .sort({ createdAt: -1 }) // Sort newest first
            .limit(30); // Limit the number of notifications returned

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = async (req, res, next) => {
    try {
        const notificationId = req.params.id;
         // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            res.status(400);
            throw new Error('Invalid Notification ID format');
        }

        // Find the notification
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            res.status(404);
            throw new Error('Notification not found');
        }

        // --- Authorization Check ---
        // Ensure the notification actually belongs to the user trying to mark it read
        if (!notification.recipientRef.equals(req.user._id)) {
            res.status(403); // Forbidden
            throw new Error('Not authorized to update this notification');
        }

        // --- Update if necessary ---
        if (!notification.read) {
            notification.read = true;
            await notification.save();
        }

        // Re-populate might be needed if FE depends on populated data after update
        // For simplicity, just return the updated (or unchanged if already read) doc
        // const updatedAndPopulated = await Notification.findById(notificationId).populate(...) // etc.

        res.json(notification); // Send the updated notification object

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all unread notifications for the user as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        // Update multiple documents:
        // Find all notifications for the current user that are currently unread (`read: false`)
        // Set their `read` field to `true`
        const result = await Notification.updateMany(
            { recipientRef: req.user._id, read: false }, // Filter criteria
            { $set: { read: true } } // Update operation
        );

        console.log(`Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`);

        // Send success response (no specific data needed, just confirmation)
        res.status(200).json({ message: 'All notifications marked as read', count: result.modifiedCount });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};