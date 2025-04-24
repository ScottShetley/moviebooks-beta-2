// client/src/components/Notification/NotificationItem/NotificationItem.js
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

  // Determine the target link for the entire notification item
  let notificationLink = null;
  const lowerCaseType = notification.type?.toLowerCase(); // Get lowercase type once

  // Priority for linking the whole item:
  // 1. Backend-provided 'link' field (most specific)
  // 2. Connection detail page for connection-related types
  // 3. Sender profile for 'new_follower' type
  if (notification.link) {
      notificationLink = notification.link;
  } else if (notification.connectionRef && notification.connectionRef._id) {
      notificationLink = `/connections/${notification.connectionRef._id}`;
      // For comments, maybe link directly to the comments section on detail page
      if (lowerCaseType === 'comment') {
         notificationLink += '#comments';
      }
  } else if (notification.senderRef && notification.senderRef._id && lowerCaseType === 'new_follower') {
      // Link to sender's profile for new follower notification
      notificationLink = `/users/${notification.senderRef._id}`;
  }
  // 'like' and 'favorite' also typically link to the connection,
  // which is covered by the connectionRef logic above if it exists.

  // Only add item click handler if there's a link
  const handleItemClick = notificationLink ? () => {
     if (!notification.read) {
        markAsRead(notification._id);
     }
     // Navigation is handled by the Link component itself via the 'to' prop
     // No need for manual navigation here if using <Link> for the wrapper
  } : undefined; // No handler if it's just a div


   const handleMarkReadButtonClick = (e) => {
     // This specifically handles clicking the "Mark Read" button
     e.preventDefault(); // Prevent default button behavior
     e.stopPropagation(); // Stop the event from bubbling up to the item wrapper click
     if (!notification.read) {
        markAsRead(notification._id);
     }
  };


  const itemClasses = `${styles.item} ${notification.read ? '' : styles.unread}`;

  let displayContent; // This will hold the JSX or string to render

  // Always try to get sender username
  const senderUsername = notification.senderRef?.username;
  const senderId = notification.senderRef?._id; // Also get sender ID for linking

  // Decide how to display the sender's name element.
  // It should be a Link *only if* the whole notification item is NOT already
  // linking to the sender's profile. Otherwise, it's just text.
  const isItemLinkingToSenderProfile = notificationLink && senderId && notificationLink === `/users/${senderId}`;

  const SenderNameElement = (
    senderUsername
    ? (
        // If the whole item is NOT linking to the sender's profile,
        // make the sender name itself a link.
        !isItemLinkingToSenderProfile
         ? (
              <Link
                 to={`/users/${senderId}`} // Link to sender's profile using correct path
                 className={styles.senderLink}
                 onClick={(e) => e.stopPropagation()} // Prevent parent div/link click if it existed
              >
                  {senderUsername}
              </Link>
         ) : (
             // If the whole item IS the link to the sender's profile (like new_follower),
             // just render the username as text/span to avoid nested links.
             // The outer Wrapper Link handles navigation.
             <span className={styles.senderNameText}>{senderUsername}</span>
         )
      )
    : <span className={styles.senderNameText}>Someone</span> // Fallback if no sender or username
  );


  // Use the lowercase type for the switch statement
  switch (lowerCaseType) {
      case 'new_follower':
          displayContent = (
              <>
                  {SenderNameElement} {' is now following you.'}
              </>
          );
          // Outer link is handled by the notificationLink = `/users/${notification.senderRef._id}` logic above.
          break;

      case 'like':
          const connectionTitleLike = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
                  {SenderNameElement} {` liked your connection: "${connectionTitleLike}"`}
              </>
          );
          // Outer link is handled by the notificationLink = `/connections/...` logic above.
          break;

      case 'comment':
           const connectionTitleComment = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
               {SenderNameElement} {` commented on your connection: "${connectionTitleComment}"`}
              </>
          );
          // Outer link is handled by the notificationLink = `/connections/...` logic above.
          break;

      case 'favorite':
           const connectionTitleFavorite = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
               {SenderNameElement} {` favorited your connection: "${connectionTitleFavorite}"`}
              </>
          );
          // Outer link is handled by the notificationLink = `/connections/...` logic above.
          break;

      default:
          // Fallback for truly unknown types or older notifications that only used message
          console.warn(`[NotificationItem] Unknown notification type: ${notification.type}. Falling back to message parsing or generic display.`, notification);
          const message = notification.message || 'Notification details unavailable.';

           // For fallback, we can attempt to replace a placeholder (like sender username if present in message)
           // with the SenderNameElement component (which might be a Link or span)
           if (senderUsername && message.includes(senderUsername)) {
               const parts = message.split(senderUsername);
               displayContent = (
                   <>
                       {parts[0]}
                       {SenderNameElement} {/* Use the component which might be Link or span */}
                       {parts.slice(1).join(senderUsername)} {/* Join remaining parts */}
                   </>
               );
           } else {
              // If no senderRef or username not found in message, just display the message and SenderNameElement
              // In this default case, the SenderNameElement would be "Someone" as the link logic above wouldn't apply.
              displayContent = (
                  <>
                      {SenderNameElement}: {message} {/* Add a colon for clarity */}
                  </>
              );
           }
          // Outer link is handled by the notificationLink logic above (e.g., if notification.link existed).
          break;
  }
  // --- End Notification Content Logic ---

    // Decide whether the outer div should be a link based on notificationLink
    // Use the Wrapper component (Link or div)
    // Pass the link target and click handler if it's a Link
    const Wrapper = notificationLink ? Link : 'div';
    const wrapperProps = notificationLink
      ? { to: notificationLink, onClick: handleItemClick }
      : {}; // No click handler needed if it's just a div


  return (
    // Use the Wrapper component (Link or div)
    // If Wrapper is Link, it handles the primary navigation on click.
    <Wrapper className={itemClasses} {...wrapperProps}>
        <div className={styles.content}>
            {displayContent}
            <span className={styles.timestamp}>{timeSince(notification.createdAt)}</span>
        </div>
        {/* Only show Mark Read button if unread */}
        {!notification.read && (
            <div className={styles.actions}>
                {/* Mark Read button - handles its own click to not trigger parent link */}
                <button onClick={handleMarkReadButtonClick} title="Mark as read">
                   Mark Read
                </button>
            </div>
        )}
    </Wrapper>
  );
};

export default NotificationItem;