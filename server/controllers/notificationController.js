// server/controllers/notificationController.js (ES Modules)
import Notification from '../models/Notification.js'; // Use .js extension
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id }) // Ensure model uses 'recipient'
        .populate('sender', 'username _id') // Use 'sender', populate username
        .populate({
            path: 'connectionRef',
            select: 'movieRef bookRef context screenshotImageUrl', // Use correct field name
            populate: [
                { path: 'movieRef', select: 'title' },
                { path: 'bookRef', select: 'title' }
            ]
         })
        .sort({ createdAt: -1 })
        .limit(30);
    res.json(notifications);
});

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        res.status(400); throw new Error('Invalid Notification ID format');
    }
    const notification = await Notification.findById(notificationId);
    if (!notification) {
        res.status(404); throw new Error('Notification not found');
    }
    // Ensure model uses 'recipient' field name
    if (!notification.recipient.equals(req.user._id)) {
        res.status(403); throw new Error('Not authorized to update this notification');
    }
    if (!notification.read) {
        notification.read = true;
        await notification.save();
    }
    res.json(notification);
});

// @desc    Mark all unread notifications for the user as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    // Ensure model uses 'recipient' field name
    const result = await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { $set: { read: true } }
    );
    console.log(`Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`);
    res.status(200).json({ message: 'All notifications marked as read', count: result.modifiedCount });
});

// --- Use NAMED exports ---
export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};