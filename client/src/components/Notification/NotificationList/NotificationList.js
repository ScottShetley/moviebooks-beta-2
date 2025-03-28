// client/src/components/Notification/NotificationList/NotificationList.js
import React from 'react';
import { useNotifications } from '../../../contexts/NotificationContext'; // Use the context
import NotificationItem from '../NotificationItem/NotificationItem';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import styles from './NotificationList.module.css';

const NotificationList = () => {
  const {
    notifications,
    loading,
    error,
    markAllAsRead,
    unreadCount
   } = useNotifications(); // Get state and functions from context

  const handleMarkAll = () => {
      if (unreadCount > 0) {
          markAllAsRead();
      }
  }

  return (
    <div className={styles.listContainer}>
       <div className={styles.header}>
           <h2>Notifications</h2>
           <button
               onClick={handleMarkAll}
               disabled={loading || unreadCount === 0}
               className={styles.markAllButton}
            >
               Mark All as Read ({unreadCount})
           </button>
       </div>


      {/* Show Loading or Error States */}
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* Show Notification List or Empty Message */}
      {!loading && !error && (
        <>
          {notifications.length === 0 ? (
            <p className={styles.emptyMessage}>You have no notifications.</p>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem key={notification._id} notification={notification} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationList;