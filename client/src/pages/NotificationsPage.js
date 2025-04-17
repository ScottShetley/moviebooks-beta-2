// client/src/pages/NotificationsPage.js
import React from 'react';
// Import the component that handles fetching and displaying the list of notifications
import NotificationList from '../components/Notification/NotificationList/NotificationList';

// Optional: Import page-specific styles if you create them
// import styles from './NotificationsPage.module.css';

/**
 * Renders the page dedicated to displaying user notifications.
 * This component primarily acts as a container for the NotificationList component.
 */
const NotificationsPage = () => {
  return (
    // Main container div for the page.
    // Consider adding a CSS module and a container class (e.g., styles.notificationsPageContainer)
    // for consistent page layout (max-width, padding, margins).
    <div>
      {/* Render the NotificationList component.
          It likely contains its own heading (e.g., "Notifications") and handles
          fetching data, displaying items, and interaction logic (like marking as read). */}
      <NotificationList />
    </div>
  );
};

export default NotificationsPage;
