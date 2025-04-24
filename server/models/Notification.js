// server/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipientRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: true,
        index: true // Index for efficient querying
    },
    senderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (the user who caused the notification)
        required: true
    },
    type: {
        type: String,
        required: true,
        // Define allowed notification types
        // *** IMPORTANT: Ensure all types you use are listed here ***
        // Including uppercase versions handles any existing data saved that way.
        enum: [
            'like',          // User liked your connection
            'comment',       // User commented on your connection
            'new_follower',  // User started following you
            'favorite',      // User favorited your connection
            // Add uppercase versions if your database contains them:
            'LIKE',
            'COMMENT',
            'FAVORITE'
            // Add other types as needed (e.g., 'reply', 'mention')
        ],
        // Optional: Add a custom validator message
        message: 'Invalid notification type.'
    },
    message: {
        type: String,
        // Optional, backend might generate a message string,
        // or frontend might construct it based on type and populated refs
        required: false // Make message optional as frontend can construct
    },
    link: {
        type: String,
        // Optional: A specific frontend route the user should navigate to
        // when clicking the notification (e.g., '/connections/abc#comments')
        required: false
    },
    connectionRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection', // References the Connection model if the notification is connection-related
        required: false // Make connectionRef optional
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Ensure compound index for faster lookups by recipient and read status
notificationSchema.index({ recipientRef: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;