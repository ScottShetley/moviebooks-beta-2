// client/src/components/Notification/NotificationItem/NotificationItem.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useNotifications } from '../../../contexts/NotificationContext';
import styles from './NotificationItem.module.css';
import { getStaticFileUrl } from '../../../services/api'; // Import the helper utility

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
  const navigate = useNavigate(); // Initialize useNavigate hook

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

  // Handle click on the entire item
   const handleItemClick = () => {
     // Only navigate if there's a link defined for the item
     if (notificationLink) {
        // Mark as read *before* navigating
        if (!notification.read) {
           markAsRead(notification._id);
        }
        navigate(notificationLink); // Navigate using hook
     }
  };


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

  // Always try to get sender username and avatar
  const senderUsername = notification.senderRef?.username;
  const senderId = notification.senderRef?._id;
  const senderAvatarUrl = notification.senderRef?.profilePictureUrl; // Get avatar URL

  // Decide how to display the sender's name element.
  // It should ALWAYS be a Link to the sender's profile, as the outer element is no longer always a Link.
  const SenderNameElement = (
    senderUsername
    ? (
        // Always render as a Link to the sender's profile
        <Link
           to={`/users/${senderId}`} // Link to sender's profile using correct path
           className={styles.senderLink} // Apply sender link styles
           onClick={(e) => e.stopPropagation()} // IMPORTANT: Prevent parent div click handler when clicking the sender link
        >
            {senderUsername}
        </Link>
      )
    : <span className={styles.senderNameText}>Someone</span> // Fallback if no sender or username, apply sender name text styles
  );


  // Use the lowercase type for the switch statement
  switch (lowerCaseType) {
      case 'new_follower':
          displayContent = (
              <>
                  {SenderNameElement} {' is now following you.'}
              </>
          );
          // The outer div click will navigate to the sender's profile because notificationLink is set to /users/:senderId
          break;

      case 'like':
          const connectionTitleLike = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
                  {SenderNameElement} {` liked your connection: `}
                  <span className={styles.connectionTitleText}> {/* Wrap title in span */}
                      {`"${connectionTitleLike}"`}
                  </span>
              </>
          );
           // The outer div click will navigate to the connection because notificationLink is set to /connections/:id
          break;

      case 'comment':
           const connectionTitleComment = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
               {SenderNameElement} {` commented on your connection: `}
                <span className={styles.connectionTitleText}> {/* Wrap title in span */}
                    {`"${connectionTitleComment}"`}
                </span>
              </>
          );
           // The outer div click will navigate to the connection because notificationLink is set to /connections/:id
          break;

      case 'favorite':
           const connectionTitleFavorite = notification.connectionRef
             ? `${notification.connectionRef.movieRef?.title || 'a movie'} / ${notification.connectionRef.bookRef?.title || 'a book'}`
             : 'a connection';

          displayContent = (
              <>
               {SenderNameElement} {` favorited your connection: `}
                <span className={styles.connectionTitleText}> {/* Wrap title in span */}
                    {`"${connectionTitleFavorite}"`}
                </span>
              </>
          );
           // The outer div click will navigate to the connection because notificationLink is set to /connections/:id
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
                       {SenderNameElement} {/* Use the component which is now always a Link */}
                       {parts.slice(1).join(senderUsername)} {/* Join remaining parts */}
                   </>
               );
           } else {
              // If no senderRef or username not found in message, just display the message and SenderNameElement
              // In this default case, the SenderNameElement would be "Someone" as a Link.
              displayContent = (
                  <>
                      {SenderNameElement}: {message} {/* Add a colon for clarity */}
                  </>
              );
           }
          // Outer link handling via notificationLink logic above remains the same.
          break;
  }
  // --- End Notification Content Logic ---

    // The outer element is now always a div to prevent nested links
    const Wrapper = 'div';
    // The click handler is attached to this outer div
    const wrapperProps = {
      onClick: handleItemClick,
      // Add a cursor style to indicate it's clickable *if* there's a link
      style: { cursor: notificationLink ? 'pointer' : 'default' }
    };


    // Determine avatar source URL
    const DEFAULT_AVATAR_PATH = '/images/default-avatar.png'; // <--- **SET YOUR DEFAULT AVATAR PATH HERE**
    const avatarSrc = senderAvatarUrl
        ? getStaticFileUrl(senderAvatarUrl)
        : getStaticFileUrl(DEFAULT_AVATAR_PATH);


  return (
    // Outer element is a div
    <Wrapper className={itemClasses} {...wrapperProps}> {/* Use the div Wrapper with onClick */}
        {/* Wrap avatar and content in the avatarAndContent div */}
        <div className={styles.avatarAndContent}>
            {/* Render Avatar */}
            {avatarSrc && (
                <img
                    src={avatarSrc}
                    alt={`${senderUsername || 'User'}'s avatar`}
                    className={styles.avatar}
                />
            )}
            {/* Original Content */}
            <div className={styles.content}>
                {displayContent}
                <span className={styles.timestamp}>{timeSince(notification.createdAt)}</span>
            </div>
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