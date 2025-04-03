// client/src/components/Notification/NotificationItem.js
import React from 'react';
// import { Link } from 'react-router-dom'; // Link might not be needed directly in the message anymore
import { useNotifications } from '../../../contexts/NotificationContext'; // To mark as read
import styles from './NotificationItem.module.css';

// Helper function to format time difference (simple version) - remains the same
const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};


// Props:
// - notification: The notification object from the context/API
const NotificationItem = ({ notification }) => {
  const { markAsRead } = useNotifications(); // Get markAsRead function

  const handleMarkRead = (e) => {
     e.preventDefault(); // Prevent potential link navigation if button is inside link
     e.stopPropagation();
     if (!notification.read) {
        markAsRead(notification._id);
     }
  };

  // --- Generate Notification Text ---
  // REMOVED: All the previous logic using senderRef, connectionRef, and switch(notification.type)
  // The message now comes directly from the backend.

  // Combine base class with unread class if applicable
  const itemClasses = `${styles.item} ${notification.read ? '' : styles.unread}`;

  // Basic check in case message is missing for older notifications or errors
  const displayMessage = notification.message || 'Notification details unavailable.';

  return (
    <div className={itemClasses}>
        <div className={styles.content}>
            {/* --- MODIFIED: Display the message directly from the notification object --- */}
            {displayMessage}
            {/* --- END MODIFICATION --- */}
            <span className={styles.timestamp}>{timeSince(notification.createdAt)}</span>
        </div>
        {!notification.read && (
            <div className={styles.actions}>
                <button onClick={handleMarkRead} title="Mark as read">
                   Mark Read
                </button>
            </div>
        )}
    </div>
  );
};

export default NotificationItem;