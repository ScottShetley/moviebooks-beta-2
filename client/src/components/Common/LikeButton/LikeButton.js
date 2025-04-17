// client/src/components/Common/LikeButton/LikeButton.js
import React, { useState, useEffect } from 'react';
// Import icons for liked and unliked states
import { FaThumbsUp, FaRegThumbsUp } from 'react-icons/fa';
// Import custom hook to get user authentication status
import { useAuth } from '../../../contexts/AuthContext';
// Import the configured API instance for making requests
import api from '../../../services/api';
// Import reusable loading spinner component
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
// Import component-specific styles
import styles from './LikeButton.module.css';

/**
 * A reusable button component for liking/unliking a connection.
 * It displays the current like count and visually indicates if the current user has liked it.
 * It handles the API call and notifies a parent component of the update.
 */
// Props:
// - connectionId: The ID of the connection to be liked/unliked.
// - initialLikes: An array of user IDs (or user objects) who have liked the connection. Defaults to [].
// - onLikeUpdate: A callback function that receives the *full updated connection object* from the API response.
const LikeButton = ({ connectionId, initialLikes = [], onLikeUpdate }) => {
    // --- Hooks ---
    // Get the current logged-in user object from the AuthContext
    const { user } = useAuth();

    // --- State Variables ---
    // Track if the like/unlike API request is currently in progress
    const [isLiking, setIsLiking] = useState(false);
    // Store any local error specific to the like/unlike action for this button
    const [error, setError] = useState(null);
    // Store whether the current user has liked this connection (derived from props)
    const [isLiked, setIsLiked] = useState(false);
    // Store the current like count (derived from props)
    const [likeCount, setLikeCount] = useState(initialLikes.length);

    // --- Effects ---
    /**
     * useEffect hook to recalculate the 'isLiked' status and 'likeCount'
     * whenever the 'user' object or the 'initialLikes' array prop changes.
     * This ensures the button reflects the correct state even if the parent data updates.
     */
    useEffect(() => {
        // Check if the user is logged in AND if their ID exists in the initialLikes array.
        // Handles cases where initialLikes might contain full user objects or just IDs.
        setIsLiked(!!user && initialLikes.some(like => like === user?._id || like?._id === user?._id));
        // Update the like count based on the length of the initialLikes array.
        setLikeCount(initialLikes.length);
    }, [user, initialLikes]); // Dependencies: Re-run when user or initialLikes change


    // --- Event Handlers ---
    /**
     * Handles the click event on the like button.
     * Performs validation, makes the API call, calls the parent update function,
     * and manages loading/error states.
     */
    const handleLikeToggle = async () => {
        // Prevent action if not logged in, already liking, or connectionId is missing
        if (!user || isLiking || !connectionId) return;

        // Set loading state and clear previous errors
        setIsLiking(true);
        setError(null);

        try {
            // Perform the API call to the like/unlike endpoint
            // The backend should handle toggling the like status for the user.
            const { data } = await api.post(`/connections/${connectionId}/like`);

            // IMPORTANT: Call the parent's update function (onLikeUpdate)
            // Pass the full updated connection object received from the API response.
            // This allows the parent component (e.g., Feed, ConnectionCard) to update its
            // state, which is the source of truth for the 'initialLikes' prop.
            if (onLikeUpdate) {
                onLikeUpdate(data.connection);
            }
            // Note: Direct optimistic UI updates within this component (commented out previously)
            // are less critical here because the parent update mechanism ensures consistency
            // when the props change via onLikeUpdate.

        } catch (err) {
            // Log the error for debugging (optional for production)
            console.error(`[LikeButton - ${connectionId}] Error:`, err);
            // Set a user-friendly local error message
            setError("Like failed");
            // If optimistic updates were used, they would be reverted here.
        } finally {
            // Ensure the loading state is turned off regardless of success or failure
            setIsLiking(false);
        }
    };

    // --- Render Logic ---
    return (
        <button
            // Apply base styles and conditionally add 'liked' class
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeToggle} // Attach the click handler
            // Disable button if user isn't logged in or if an API call is in progress
            disabled={!user || isLiking}
            // Set tooltip text based on liked state
            title={isLiked ? "Unlike" : "Like"}
            // --- Accessibility Attributes ---
            // Provide a descriptive label for screen readers, including the current count
            aria-label={isLiked ? `Unlike connection, currently ${likeCount} likes` : `Like connection, currently ${likeCount} likes`}
            // Indicate the button's pressed state (true if liked, false otherwise)
            aria-pressed={isLiked}
            // --- End Accessibility Attributes ---
        >
            {/* Conditionally render loading spinner or like icon */}
            {isLiking ? (
                <LoadingSpinner size="small" inline />
            ) : (
                // Show solid thumb if liked, outline thumb if not
                isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />
            )}
            {/* Display the current like count */}
            <span className={styles.count}>{likeCount}</span>
            {/* Display local error message near the button if an error exists */}
            {error && <span className={styles.inlineError}>{error}</span>}
        </button>
    );
};

export default LikeButton;
