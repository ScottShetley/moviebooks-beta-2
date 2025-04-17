// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance
import { useAuth } from './AuthContext'; // Need user status to fetch notifications

// Create the context to hold notification state and functions
const NotificationContext = createContext();

// Create the provider component that will wrap parts of your app
export const NotificationProvider = ({ children }) => {
    // --- Hooks ---
    // Get user state from AuthContext to know if we should fetch notifications
    const { user } = useAuth();

    // --- State Variables ---
    // Holds the array of notification objects fetched from the API
    const [notifications, setNotifications] = useState([]);
    // Holds the count of notifications where 'read' is false
    const [unreadCount, setUnreadCount] = useState(0);
    // Tracks loading state specifically for notification fetching/updating actions
    const [loading, setLoading] = useState(false);
    // Holds error messages related to notification actions
    const [error, setError] = useState(null);

    // --- Function to Fetch Notifications ---
    /**
     * Fetches notifications from the API for the currently logged-in user.
     * Updates the notifications array and unread count state.
     */
    const fetchNotifications = useCallback(async () => {
        // If no user is logged in, clear state and exit
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        // Set loading state and clear previous errors
        setLoading(true);
        setError(null);
        try {
            // Make the API call to the notifications endpoint
            const { data } = await api.get('/notifications');

            // Update state with the fetched notifications
            setNotifications(data);
            // Calculate the unread count based on the 'read' property of fetched notifications
            const count = data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (err) {
            // Handle errors during fetching
            const message = err.response?.data?.message || err.message || 'Failed to fetch notifications';
            console.error("Notification fetch error:", message, err); // Keep this error log
            setError(message);
            // Clear state on error to avoid displaying stale data
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            // Ensure loading state is turned off after the attempt
            setLoading(false);
        }
    }, [user]); // Dependency: Re-run if 'user' changes (login/logout)

    // --- Effect for Initial Fetch ---
    /**
     * Runs when the component mounts and whenever the fetchNotifications function instance changes
     * (which happens when the 'user' dependency of fetchNotifications changes).
     * This ensures notifications are fetched initially and upon login/logout.
     */
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]); // Dependency: The fetchNotifications function itself

    // --- Function to Mark a Single Notification as Read ---
    /**
     * Marks a specific notification as read, both locally (optimistically) and on the server.
     * Handles potential rollback if the API call fails.
     * @param {string} notificationId - The ID of the notification to mark as read.
     */
    const markAsRead = useCallback(async (notificationId) => {
        // Find the notification in the current state
        const targetNotification = notifications.find(n => n._id === notificationId);
        // If the notification doesn't exist or is already marked as read, do nothing.
        if (!targetNotification || targetNotification.read) {
            return;
        }

        // --- Optimistic UI Update ---
        // Store the original state in case we need to roll back
        const originalNotifications = [...notifications];
        // Update the local state immediately, assuming the API call will succeed.
        setNotifications(prev =>
            prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
        );
        // Decrement the unread count, ensuring it doesn't go below zero.
        setUnreadCount(prev => Math.max(0, prev - 1));
        setError(null); // Clear previous errors

        try {
            // Make the API call to update the notification status on the server
            await api.patch(`/notifications/${notificationId}/read`);
            // If the API call succeeds, the optimistic update is correct. No further action needed.
        } catch (err) {
            // --- Rollback on Error ---
            console.error("Error marking notification as read:", err); // Keep error log
            setError('Failed to mark notification as read. Please try again.');
            // Restore the notification state to its original value before the optimistic update.
            setNotifications(originalNotifications);
            // Recalculate the unread count accurately based on the rolled-back state.
            const count = originalNotifications.filter(n => !n.read).length;
            setUnreadCount(count);
        }
    }, [notifications]); // Dependency: 'notifications' array is needed to find the target and for rollback

    // --- Function to Mark All Notifications as Read ---
    /**
     * Marks all notifications as read, both locally (optimistically) and on the server.
     * Handles potential rollback if the API call fails.
     */
     const markAllAsRead = useCallback(async () => {
        // If there are no unread notifications, do nothing.
        if (unreadCount === 0) return;

        // --- Optimistic UI Update ---
        const originalNotifications = [...notifications]; // Backup for rollback
        // Update local state: map over all notifications and set 'read' to true.
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        // Reset unread count to zero.
        setUnreadCount(0);
        setError(null); // Clear previous errors

        try {
            // Make the API call to mark all notifications as read on the server.
            await api.patch('/notifications/read-all');
            // If successful, the optimistic update is correct.
        } catch (err) {
            // --- Rollback on Error ---
            console.error("Error marking all notifications as read:", err); // Keep error log
            setError('Failed to mark all notifications as read. Please try again.');
            // Restore the original notification state.
            setNotifications(originalNotifications);
            // Recalculate the unread count accurately.
            const count = originalNotifications.filter(n => !n.read).length;
            setUnreadCount(count);
        }
    }, [notifications, unreadCount]); // Dependencies: 'notifications' for rollback, 'unreadCount' to prevent unnecessary calls

    // --- Function to Add a Notification Locally ---
    /**
     * Adds a new notification object to the beginning of the local state list.
     * Useful for real-time updates (e.g., via WebSockets) or optimistic additions.
     * Includes a check to prevent adding duplicate notifications.
     * @param {object} notification - The new notification object to add.
     */
    const addNotificationLocally = useCallback((notification) => {
        // Update state using the functional form to ensure atomicity
        setNotifications(prev => {
            // Check if a notification with the same ID already exists in the list
            if (!prev.some(n => n._id === notification._id)) {
                // If it doesn't exist, create a new array with the new notification at the start
                 const newNotifications = [notification, ...prev];
                 // Recalculate the unread count based on the new list
                 const count = newNotifications.filter(n => !n.read).length;
                 setUnreadCount(count); // Update the unread count state
                 return newNotifications; // Return the new array as the updated state
            }
            // If the notification already exists, return the previous state unchanged
            return prev;
        });
    }, []); // No external dependencies needed due to functional update form

    // --- Context Value ---
    // Define the object containing state and functions to be provided by the context
    const contextValue = {
        notifications,      // Array of notification objects
        unreadCount,        // Number of unread notifications
        loading,            // Boolean loading state for notifications
        error,              // String error message or null
        fetchNotifications, // Function to manually refetch notifications
        markAsRead,         // Function to mark one notification as read
        markAllAsRead,      // Function to mark all notifications as read
        addNotificationLocally // Function for optimistic/real-time updates
    };

    // --- Provider Component ---
    // Render the context provider, passing the contextValue to consuming components
    return (
        <NotificationContext.Provider value={contextValue}>
            {children} {/* Render child components wrapped by this provider */}
        </NotificationContext.Provider>
    );
};

// --- Custom Hook for Consuming Context ---
/**
 * A custom hook to simplify accessing the NotificationContext value.
 * Includes an error check to ensure it's used within a NotificationProvider.
 * @returns {object} The NotificationContext value.
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    // Throw an error if the hook is used outside of a NotificationProvider
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
