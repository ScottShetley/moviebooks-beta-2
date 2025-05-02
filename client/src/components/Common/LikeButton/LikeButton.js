// client/src/components/Common/LikeButton/LikeButton.js
import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaRegThumbsUp } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './LikeButton.module.css'; // We'll create this CSS module

const LikeButton = ({ connectionId, initialLikes = [], onLikeUpdate }) => {
    const { user } = useAuth();
    const [isLiking, setIsLiking] = useState(false);
    const [error, setError] = useState(null); // Local error state for this button

    // Derive liked status and count from props
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(initialLikes.length);

    // Effect to update liked status when user or initialLikes change
    useEffect(() => {
        setIsLiked(!!user && initialLikes.some(like => like === user?._id || like?._id === user?._id));
        setLikeCount(initialLikes.length);
    }, [user, initialLikes]);


    const handleLikeToggle = async () => {
        if (!user || isLiking || !connectionId) return;
        setIsLiking(true);
        setError(null); // Clear previous errors

        try {
            // Perform API call
            const { data } = await api.post(`/connections/${connectionId}/like`);

            // Call the parent's update function with the FULL updated connection
            // This is crucial for keeping the list state consistent
            if (onLikeUpdate) {
                onLikeUpdate(data.connection);
            }

            // --- Optimistic UI Update (Optional but improves UX) ---
            // We can update the local state immediately based on the *expected* result,
            // even before the parent state trickles down.
            // This is less critical since the parent `onLikeUpdate` handles the source of truth.
            // setIsLiked(!isLiked);
            // setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
            // --- End Optimistic Update ---

        } catch (err) {
            console.error(`[LikeButton - ${connectionId}] Error:`, err);
            setError("Like failed"); // Set local error
            // Revert optimistic update if it failed (if implemented)
            // setIsLiked(isLiked);
            // setLikeCount(likeCount);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <button
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeToggle}
            disabled={!user || isLiking}
            title={isLiked ? "Unlike" : "Like"}
            aria-label={isLiked ? `Unlike connection, currently ${likeCount} likes` : `Like connection, currently ${likeCount} likes`}
            aria-pressed={isLiked}
        >
            {isLiking ? (
                <LoadingSpinner size="small" inline />
            ) : (
                isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />
            )}
            <span className={styles.count}>{likeCount}</span>
            {/* Optional: Display local error near the button */}
            {error && <span className={styles.inlineError}>{error}</span>} {/* <-- Uncommented this line */}
        </button>
    );
};

export default LikeButton;