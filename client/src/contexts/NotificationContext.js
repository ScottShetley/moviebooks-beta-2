// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our Axios instance
import { useAuth } from './AuthContext'; // Need user status to fetch notifications

// Create the context
const NotificationContext = createContext();

// Create the provider component
export const NotificationProvider = ({ children }) => {
    const { user } = useAuth(); // Get user state from AuthContext
    const [notifications, setNotifications] = useState([]); // Array of notification objects
    const [unreadCount, setUnreadCount] = useState(0); // Number of unread notifications
    const [loading, setLoading] = useState(false); // Loading state for fetching
    const [error, setError] = useState(null); // Error state for fetching/updating

    // --- Function to Fetch Notifications ---
    const fetchNotifications = useCallback(async () => {
        // Only fetch if user is logged in
        if (!user) {
            setNotifications([]); // Clear notifications if logged out
            setUnreadCount(0);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Make API call to get notifications
            const { data } = await api.get('/notifications');

            // Update state with fetched notifications
            setNotifications(data);
            // Calculate unread count from the fetched data
            const count = data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to fetch notifications';
            console.error("Notification fetch error:", message, err); // Keep this error log for actual errors
            setError(message);
            setNotifications([]); // Clear notifications on error
            setUnreadCount(0);
        } finally {
            setLoading(false); // Ensure loading is set to false even on error
        }
    }, [user]); // Dependency: Re-run fetch if the user object changes (login/logout)

    // Effect to fetch notifications when the component mounts or when the user logs in/out
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]); // Run whenever fetchNotifications function instance changes (due to user change)

    // --- Function to Mark a Single Notification as Read ---
    const markAsRead = useCallback(async (notificationId) => {
        // Find the notification in the current state
        const targetNotification = notifications.find(n => n._id === notificationId);
        // If already read or not found, do nothing
        if (!targetNotification || targetNotification.read) {
            return;
        }

        // Optimistic UI Update: Mark as read immediately in the local state
        const originalNotifications = [...notifications]; // Keep backup for rollback
        setNotifications(prev =>
            prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1)); // Decrement unread count safely

        try {
            // Make API call to mark as read on the server
            await api.patch(`/notifications/${notificationId}/read`);
            // Success: Optimistic update is now confirmed by server
        } catch (err) {
            console.error("Error marking notification as read:", err); // Keep error log
            // Rollback UI changes if API call fails
            setError('Failed to mark notification as read. Please try again.');
            setNotifications(originalNotifications);
            // Recalculate count accurately after rollback
            const count = originalNotifications.filter(n => !n.read).length;
            setUnreadCount(count);
        }
    }, [notifications]); // Dependency: notifications array (to find the target)

    // --- Function to Mark All Notifications as Read ---
     const markAllAsRead = useCallback(async () => {
        // If there are no unread notifications, do nothing
        if (unreadCount === 0) return;

        // Optimistic UI Update
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        setError(null); // Clear previous errors

        try {
            // Make API call to mark all as read on the server
            await api.patch('/notifications/read-all');
            // Success
        } catch (err) {
            console.error("Error marking all notifications as read:", err); // Keep error log
            // Rollback UI changes
            setError('Failed to mark all notifications as read. Please try again.');
            setNotifications(originalNotifications);
            const count = originalNotifications.filter(n => !n.read).length;
            setUnreadCount(count);
        }
    }, [notifications, unreadCount]); // Dependencies: notifications and unreadCount

    // --- Function to Add a Notification Locally ---
    const addNotificationLocally = useCallback((notification) => {
        // Avoid adding duplicates if already present
        setNotifications(prev => {
            if (!prev.some(n => n._id === notification._id)) {
                // Add to the beginning of the list
                 const newNotifications = [notification, ...prev];
                 // Recalculate unread count
                 const count = newNotifications.filter(n => !n.read).length;
                 setUnreadCount(count);
                 return newNotifications;
            }
            return prev; // No change if already exists
        });
    }, []);

    // Value provided by the context
    const contextValue = {
        notifications,      // Array of notification objects
        unreadCount,        // Number of unread notifications
        loading,            // Boolean loading state for notifications
        error,              // String error message or null
        fetchNotifications, // Function to manually refetch notifications
        markAsRead,         // Function to mark one notification as read
        markAllAsRead,      // Function to mark all notifications as read
        addNotificationLocally // Function for optimistic/real-time updates (use with care)
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to easily consume the NotificationContext
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};