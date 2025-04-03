// server/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema (
  {
    recipientRef: {
      // The user who receives the notification
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    senderRef: {
      // The user who triggered the notification (e.g., liked the post)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Can be null for system notifications (though not used in BETA)
    },
    type: {
      type: String,
      required: true,
      enum: ['NEW_CONNECTION', 'LIKE', 'FAVORITE'], // Define allowed notification types
    },
    connectionRef: {
      // The specific connection this notification relates to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      // Required for LIKE, FAVORITE, NEW_CONNECTION (if notifying others)
      // Might not be required for other future notification types
      required: function () {
        return ['LIKE', 'FAVORITE', 'NEW_CONNECTION'].includes (this.type);
      },
    },
    // --- NEW FIELD ---
    message: {
        type: String,
        required: true, // Make the message required
    },
    // --- END NEW FIELD ---
    read: {
      // Has the recipient seen this notification?
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient fetching of a user's unread notifications, sorted by newest first
notificationSchema.index ({recipientRef: 1, read: 1, createdAt: -1});

const Notification = mongoose.model ('Notification', notificationSchema);

export default Notification;