// client/src/pages/NotificationsPage.js
import React from 'react';
import NotificationList from '../components/Notification/NotificationList/NotificationList'; // Import the list component

const NotificationsPage = () => {
  return (
    <div>
      {/* The NotificationList component contains its own heading */}
      <NotificationList />
    </div>
  );
};

export default NotificationsPage;