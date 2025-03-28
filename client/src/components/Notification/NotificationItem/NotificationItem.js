// client/src/components/Notification/NotificationItem/NotificationItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext'; // To mark as read
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
  let notificationText = null;
  const sender = notification.senderRef; // User who triggered it
  const connection = notification.connectionRef; // Associated connection
  const movieTitle = connection?.movieRef?.title || 'a movie';
  const bookTitle = connection?.bookRef?.title || 'a book';

  switch (notification.type) {
    case 'LIKE':
      notificationText = (
        <>
          <Link to={`/users/${sender?._id}`}>{sender?.email || 'Someone'}</Link>
          {' liked your connection for '}
          {/* Link to the connection's movie/book - needs a connection detail page ideally */}
          {/* For now, link to movie page */}
          <Link to={`/movies/${connection?.movieRef?._id}`}>{movieTitle}</Link>
          {' & '}
          <Link to={`/books/${connection?.bookRef?._id}`}>{bookTitle}</Link>
          .
        </>
      );
      break;
    case 'FAVORITE':
       notificationText = (
        <>
          <Link to={`/users/${sender?._id}`}>{sender?.email || 'Someone'}</Link>
          {' favorited your connection for '}
          <Link to={`/movies/${connection?.movieRef?._id}`}>{movieTitle}</Link>
          {' & '}
          <Link to={`/books/${connection?.bookRef?._id}`}>{bookTitle}</Link>
          .
        </>
      );
      break;
    // Add case for 'NEW_CONNECTION' if you implement follower notifications later
    default:
      notificationText = 'You have a new notification.';
  }

  // Combine base class with unread class if applicable
   const itemClasses = `${styles.item} ${notification.read ? '' : styles.unread}`;

  return (
    <div className={itemClasses}>
        <div className={styles.content}>
            {notificationText}
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