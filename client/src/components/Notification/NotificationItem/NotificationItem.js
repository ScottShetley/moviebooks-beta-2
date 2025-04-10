// client/src/components/Notification/NotificationItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext';
import styles from './NotificationItem.module.css';

// Helper function to format time difference (simple version)
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

const NotificationItem = ({ notification }) => {
  const { markAsRead } = useNotifications();

  const handleMarkRead = (e) => {
     e.preventDefault();
     e.stopPropagation();
     if (!notification.read) {
        markAsRead(notification._id);
     }
  };

  const itemClasses = `${styles.item} ${notification.read ? '' : styles.unread}`;

  let displayContent = notification.message || 'Notification details unavailable.';

  // Check if senderRef information is available and create link if username is in message
  if (notification.senderRef && notification.senderRef.username && notification.senderRef._id) {
      const senderUsername = notification.senderRef.username;
      const message = notification.message || '';
      const userIndex = message.indexOf(senderUsername);

      if (userIndex !== -1) {
          const part1 = message.substring(0, userIndex);
          const part2 = message.substring(userIndex + senderUsername.length);
          const profileLink = `/users/${notification.senderRef._id}`;

          displayContent = (
            <>
              {part1}
              <Link
                 to={profileLink}
                 className={styles.senderLink}
                 onClick={(e) => e.stopPropagation()} // Prevent mark read when clicking name
              >
                  {senderUsername}
              </Link>
              {part2}
            </>
          );
      } else {
          // Username not found in message, display as plain text
          displayContent = message;
      }
  } else if (notification.senderRef === null && notification.message) {
      // Handle case where sender might be null (e.g., deleted user)
      displayContent = notification.message; // Or modify to indicate user is gone
  }
  // If senderRef info is missing, displayContent remains the original message

  return (
    <div className={itemClasses}>
        <div className={styles.content}>
            {displayContent}
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