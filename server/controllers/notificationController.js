// server/controllers/notificationController.js
import Notification from '../models/Notification.js'; // Use .js extension
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler'; // Correctly importing from the package

// --- Helper function to generate and save a new notification ---
// This function is called by other controllers (like follow, like, comment)
// It does NOT send an HTTP response itself.
const generateNotification = async ({ recipient, sender, type, message, link = null, connectionRef = null }) => {
    try {
        // Basic validation (optional, but good practice)
        if (!recipient || !sender || !type || !message) {
            console.error('[generateNotification] Missing required fields:', { recipient, sender, type, message });
            // Depending on how critical, you could throw an error here, but usually logging is enough for internal helpers
            return null;
        }

        // Ensure recipient and sender are distinct (optional based on desired behavior,
        // but usually you don't notify yourself of your own actions)
        if (recipient.toString() === sender.toString()) {
             // console.log('[generateNotification] Skipping self-notification.'); // Log if you skip
             return null; // Don't create notification if sender is recipient
        }


        const newNotification = new Notification({
            recipientRef: recipient,
            senderRef: sender,
            type,
            message,
            link, // Optional link related to the notification (e.g., link to profile, connection)
            connectionRef, // Optional reference to a connection if relevant
            read: false, // Notifications are unread by default
        });

        // --- START DIAGNOSTIC LOGGING ---
        console.log(`[generateNotification] Creating notification for user ${recipient} (Type: ${type})`);
        // --- END DIAGNOSTIC LOGGING ---

        const createdNotification = await newNotification.save();

        console.log(`[generateNotification] Notification created: ${createdNotification._id}`); // Log success

        return createdNotification; // Return the created notification object
    } catch (error) {
        console.error('[generateNotification] Error creating notification:', error);
        // Log the error but don't re-throw, as the calling controller might not expect it
        // This prevents a notification failure from crashing the main request (e.g., like/follow)
        return null; // Indicate failure
    }
};
// --- End Helper function ---


// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    console.log('[getNotifications] Controller invoked.');
    if (!req.user || !req.user._id) {
        console.error('[getNotifications] User ID not found on request!');
        res.status(401); // Unauthorized
        throw new Error('User not authenticated');
    }
    console.log(`[getNotifications] Fetching notifications for user ID: ${req.user._id}`);


    const notifications = await Notification.find({
        recipientRef: req.user._id // Use recipientRef
    })
    // Populate sender and connection details
    .populate('senderRef', 'username _id profilePictureUrl')
    .populate({
        path: 'connectionRef',
        select: 'movieRef bookRef context screenshotUrl',
        populate: [
            { path: 'movieRef', select: 'title' },
            { path: 'bookRef', select: 'title' }
        ]
     })
    .sort({ createdAt: -1 })
    .limit(50) // Increased limit slightly, adjust as needed
    .lean(); // Return plain JavaScript objects


    console.log(`[getNotifications] Found ${notifications.length} notifications.`);
    // console.log('[getNotifications] Sample notification:', notifications.length > 0 ? JSON.stringify(notifications[0], null, 2) : 'None'); // Log sample if exists

    res.status(200).json(notifications); // Send 200 status with data
});

// @desc    Mark a specific notification as read or batch mark
// @route   PUT /api/notifications/mark-read (changed from PATCH)
// @access  Private
// Added ability to mark single ID or multiple IDs
const markNotificationAsRead = asyncHandler(async (req, res) => {
    // Expects { notificationIds: ['id1', 'id2'] } in body, or can still handle single ID from params
    const notificationIdsFromBody = req.body.notificationIds;
    const notificationIdFromParam = req.params.id; // Old route structure, still supported for single

    let idsToMark = [];

    if (Array.isArray(notificationIdsFromBody) && notificationIdsFromBody.length > 0) {
        idsToMark = notificationIdsFromBody.filter(id => mongoose.Types.ObjectId.isValid(id));
        console.log(`[markNotificationAsRead] Received ${notificationIdsFromBody.length} IDs in body, valid: ${idsToMark.length}`); // Logging
    } else if (notificationIdFromParam && mongoose.Types.ObjectId.isValid(notificationIdFromParam)) {
        // Fallback for old single-ID PATCH route if it still exists/is used
        idsToMark.push(notificationIdFromParam);
         console.log(`[markNotificationAsRead] Received single valid ID from params: ${notificationIdFromParam}`); // Logging
    } else {
         console.log('[markNotificationAsRead] No valid notification IDs provided.'); // Logging
        res.status(400); throw new Error('No valid notification IDs provided.');
    }

    if (idsToMark.length === 0) {
         console.log('[markNotificationAsRead] No valid IDs to process.'); // Logging
         res.status(200).json({ message: 'No valid notifications to mark as read.', count: 0 });
         return; // Exit early
    }

    // Use updateMany to mark all specified notifications as read for the current user
    // Ensure the notification belongs to the logged-in user before marking
    const result = await Notification.updateMany(
        {
            _id: { $in: idsToMark }, // Match any of the provided IDs
            recipientRef: req.user._id, // Ensure notification belongs to the user
            read: false // Only mark if currently unread
        },
        { $set: { read: true } } // Set read to true
    );

     console.log(`[markNotificationAsRead] Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`); // Logging

    res.status(200).json({ message: 'Notifications marked as read', count: result.modifiedCount, updatedIds: idsToMark });
});


// @desc    Mark all unread notifications for the user as read
// @route   PUT /api/notifications/mark-all-read (changed from PATCH read-all for clarity)
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    // Ensure model uses 'recipientRef' field name
    console.log(`[markAllNotificationsAsRead] Attempting for User: ${req.user?._id}`); // Logging

    const result = await Notification.updateMany(
        { recipientRef: req.user._id, read: false }, // Only mark unread notifications for the user
        { $set: { read: true } }
    );

    console.log(`[markAllNotificationsAsRead] Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`); // Logging

    res.status(200).json({ message: 'All notifications marked as read', count: result.modifiedCount });
});


// --- Use NAMED exports ---
export {
    getNotifications,
    markNotificationAsRead, // Note: This function handles both single ID (via params, if route exists) and batch IDs (via body)
    markAllNotificationsAsRead,
    generateNotification // <-- NEW: Export the helper function
};