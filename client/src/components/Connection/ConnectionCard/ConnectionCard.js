// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getCommentsForConnection } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import CommentList from '../../comments/CommentList';
import AddCommentForm from '../../comments/AddCommentForm';
import styles from './ConnectionCard.module.css';

// --- Import React Icons ---
import {
    FaStar,         // Filled star (for favorited)
    FaRegStar,      // Outline star (for not favorited)
    FaThumbsUp,     // Filled thumbs up (for liked)
    FaRegThumbsUp,  // Outline thumbs up (for not liked)
    FaRegCommentDots, // Comment icon
    FaTrashAlt      // Delete icon
} from 'react-icons/fa';
// --- End React Icons Import ---


const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // --- Auth Context ---
    const { user, updateUserFavorites } = useAuth(); // Get user and the update function

    // --- State Hooks ---
    const [isLiking, setIsLiking] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentsFetched, setCommentsFetched] = useState(false);

    // --- Log Component Render Start ---
    // console.log(`[ConnectionCard Render START] ID: ${connection?._id}`); // Keep minimal logging if needed

    // --- Callbacks/Memos ---
    const handleToggleComments = useCallback(async () => {
        // console.log(`[handleToggleComments - ${connection?._id}] Called. showComments: ${showComments}, commentsFetched: ${commentsFetched}`); // Optional debug
        if (!connection?._id) {
             console.error("[handleToggleComments] Cannot fetch comments: connection._id is missing or invalid!");
             setCommentError("Cannot fetch comments: Connection ID is missing.");
             if (!showComments) setShowComments(true); // Still show the error area
             setIsLoadingComments(false);
             return;
        }
        // If currently showing, just hide it
        if (showComments) {
            setShowComments(false);
            return;
        }
        // If opening and not yet fetched (or errored before)
        setShowComments(true);
        if (!commentsFetched || commentError) {
            setIsLoadingComments(true);
            setCommentError(null); // Clear previous error
            try {
                const response = await getCommentsForConnection(connection._id);
                setComments(response.data || []); // Ensure it's an array
                setCommentsFetched(true);
                // console.log(`[handleToggleComments - ${connection?._id}] Fetched ${response.data?.length || 0} comments.`); // Optional debug
            } catch (err) {
                console.error("[handleToggleComments] Error fetching comments:", err);
                const message = err.response?.data?.message || err.message || "Failed to load comments.";
                setCommentError(message);
                setCommentsFetched(false); // Allow retry
                setComments([]); // Clear potentially stale comments
            } finally {
                setIsLoadingComments(false);
            }
        }
        // If already fetched and no error, just setShowComments(true) is enough (handled above)
    }, [showComments, commentsFetched, connection?._id, commentError]); // Dependencies look correct

    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
        // If comments weren't fetched before, mark them as fetched now since we have at least one
        if (!commentsFetched) {
            setCommentsFetched(true);
        }
    }, [commentsFetched]);

    // --- Early return for invalid data ---
    if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
        console.error("[ConnectionCard Render] Incomplete connection data, rendering error.", { connection });
        return <div className={styles.card}>Error: Incomplete connection data.</div>;
    }

    // --- Derived state Calculation ---
    const isLikedByCurrentUser = !!user && !!connection.likes?.includes(user._id);
    // Calculate based on user's favorites list from context
    const isFavoritedByCurrentUser = !!user && !!user.favorites && !!connection._id && user.favorites.includes(connection._id);
    const isOwner = !!user && user._id === connection.userRef._id;

    // --- Action Handlers ---
    const handleLikeToggle = async () => {
        const currentConnectionId = connection?._id;
        // console.log(`[handleLikeToggle - ${currentConnectionId}] Clicked.`); // Optional
        if (!user || isLiking || !currentConnectionId) return;
        setIsLiking(true);
        setLocalError(null);
        try {
            const { data } = await api.post(`/connections/${currentConnectionId}/like`);
            if (onUpdate) onUpdate(data.connection); // Update parent if needed (e.g., HomePage list)
        } catch (err) {
             console.error(`[handleLikeToggle - ${currentConnectionId}] Error:`, err);
             setLocalError("Failed to update like status.");
        } finally {
             setIsLiking(false);
        }
    };

    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id; // Capture ID for logs/use
        // console.log(`[handleFavoriteToggle - ${currentConnectionId}] Clicked. User: ${!!user}, isFavoriting: ${isFavoriting}`); // Optional
        if (!user || isFavoriting || !currentConnectionId) return;

        setIsFavoriting(true);
        setLocalError(null);

        try {
            // console.log(`[handleFavoriteToggle - ${currentConnectionId}] Sending API request...`); // Optional
            const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`);
            // console.log(`[handleFavoriteToggle - ${currentConnectionId}] API success.`); // Optional

            // --- CRITICAL: Update Auth Context state ---
            // console.log(`[handleFavoriteToggle - ${currentConnectionId}] Calling updateUserFavorites from context...`); // Optional
            updateUserFavorites(currentConnectionId); // This updates the global user.favorites list
            // --- END Context Update ---

            // Optional: Update parent component state if needed (e.g., HomePage list)
            // The connection object itself might have updated counts, etc.
            if (onUpdate) {
                // console.log(`[handleFavoriteToggle - ${currentConnectionId}] Calling onUpdate prop...`); // Optional
                onUpdate(updatedConnection);
            }
        } catch (err) {
            console.error(`[handleFavoriteToggle - ${currentConnectionId}] Favorite toggle error:`, err);
            setLocalError("Failed to update favorite status.");
            // NOTE: We don't automatically revert the context update here.
            // A more robust solution might involve reverting if the API call fails,
            // but for now, we rely on the API call succeeding to keep things in sync.
        } finally {
            // console.log(`[handleFavoriteToggle - ${currentConnectionId}] Setting isFavoriting to false.`); // Optional
            setIsFavoriting(false);
        }
    };

     const handleDelete = async () => {
        const currentConnectionId = connection?._id;
        // console.log(`[handleDelete - ${currentConnectionId}] Clicked.`); // Optional
        if (!isOwner || isDeleting || !currentConnectionId || !window.confirm('Are you sure you want to delete this connection?')) return;

        setIsDeleting(true);
        setLocalError(null);
        try {
            await api.delete(`/connections/${currentConnectionId}`);
            // console.log(`[handleDelete - ${currentConnectionId}] API success.`); // Optional
            // --- CRITICAL: Remove from user's favorites if it was favorited ---
            // Check if the deleted connection was in the user's favorites before deleting
            if (user?.favorites?.includes(currentConnectionId)) {
                 // console.log(`[handleDelete - ${currentConnectionId}] Deleted connection was a favorite, calling updateUserFavorites to remove.`); // Optional
                 updateUserFavorites(currentConnectionId); // Tell context to remove it
            }
            // --- END Context Update on Delete ---
            if (onDelete) onDelete(currentConnectionId); // Notify parent to remove from list
            // No need to setIsDeleting(false) as the component will unmount
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete connection.";
            console.error(`[handleDelete - ${currentConnectionId}] Error:`, err);
            setLocalError(msg);
            setIsDeleting(false); // Re-enable button if delete failed
        }
    };

    // --- Log Component Render End ---
    // console.log(`[ConnectionCard Render END - ${connection?._id}] isFavorited: ${isFavoritedByCurrentUser}`); // Optional: Reduced logging

    // --- JSX Return ---
    return (
        <article className={styles.card}>
             {/* Header */}
            <header className={styles.header}>
                 <h3>
                    <Link to={`/movies/${connection.movieRef._id}`} className={styles.titleLink}>{connection.movieRef.title}</Link>
                    {' & '}
                    <Link to={`/books/${connection.bookRef._id}`} className={styles.titleLink}>{connection.bookRef.title}</Link>
                </h3>
            </header>
            {/* Meta */}
            <p className={styles.meta}>
                Added by{' '}
                <Link to={`/profile/${connection.userRef._id}`} className={styles.userLink}>{connection.userRef.username}</Link>
                {' on '}
                {new Date(connection.createdAt).toLocaleDateString()}
            </p>

            {/* Screenshot Section */}
            {connection.screenshotUrl ? (
                <div className={styles.screenshotWrapper}>
                    <img
                        src={connection.screenshotUrl}
                        alt={`Scene from ${connection.movieRef.title} featuring ${connection.bookRef.title}`}
                        className={styles.screenshot}
                        loading="lazy"
                    />
                </div>
            ) : (
                 <div className={`${styles.screenshotWrapper} ${styles.noScreenshotPlaceholder}`}>No Screenshot Available</div>
            )}

            {/* Context */}
            {connection.context && ( <p className={styles.context}>{connection.context}</p> )}

            {/* Additional Images */}
            {(connection.moviePosterUrl || connection.bookCoverUrl) && (
                <div className={styles.additionalImagesContainer}>
                    {connection.moviePosterUrl && (
                       <div className={styles.additionalImageWrapper}>
                            <img
                                src={connection.moviePosterUrl}
                                alt={`${connection.movieRef.title} Poster`}
                                className={styles.additionalImage}
                                loading="lazy" />
                       </div>
                    )}
                    {connection.bookCoverUrl && (
                        <div className={styles.additionalImageWrapper}>
                            <img
                                src={connection.bookCoverUrl}
                                alt={`${connection.bookRef.title} Cover`}
                                className={styles.additionalImage}
                                loading="lazy" />
                        </div>
                    )}
                </div>
             )}

            {/* Footer Actions (Using React Icons) */}
            <footer className={styles.actions}>
                {/* Like Button */}
                <button
                    className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`}
                    onClick={handleLikeToggle}
                    disabled={!user || isLiking}
                    title={isLikedByCurrentUser ? "Unlike" : "Like"}
                    aria-label={isLikedByCurrentUser ? `Unlike connection, currently ${connection.likes?.length || 0} likes` : `Like connection, currently ${connection.likes?.length || 0} likes`}
                    aria-pressed={isLikedByCurrentUser}
                >
                    {isLiking
                        ? <LoadingSpinner size="small" inline />
                        : (isLikedByCurrentUser ? <FaThumbsUp /> : <FaRegThumbsUp />) // Conditional Icon
                    }
                    <span className={styles.count}>{connection.likes?.length || 0}</span>
                </button>

                {/* Favorite Button */}
                <button
                    className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`}
                    onClick={handleFavoriteToggle}
                    disabled={!user || isFavoriting}
                    title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"}
                    aria-label={isFavoritedByCurrentUser ? "Remove connection from Favorites" : "Add connection to Favorites"}
                    aria-pressed={isFavoritedByCurrentUser}
                >
                    {isFavoriting
                        ? <LoadingSpinner size="small" inline />
                        : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />) // Conditional Icon
                    }
                    {/* Optional: Favorite count if you add it to schema later */}
                    {/* <span className={styles.count}>{connection.favorites?.length || 0}</span> */}
                </button>

                {/* Comment Button */}
                <button
                    className={`${styles.actionButton} ${styles.commentButton}`}
                    onClick={handleToggleComments}
                    title={showComments ? "Hide Comments" : "Show Comments"}
                    aria-label={showComments ? "Hide comments section" : "Show comments section"}
                    aria-expanded={showComments}
                >
                    <FaRegCommentDots /> {/* Comment Icon */}
                    {/* Optionally show comment count if available/needed */}
                    {/* <span className={styles.count}>{connection.commentCount || 0}</span> */}
                </button>

                {/* Delete Button */}
                {isOwner && (
                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Delete Connection"
                        aria-label="Delete this connection"
                    >
                        {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} {/* Delete Icon */}
                    </button>
                )}
                {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            {/* Comments Section (Collapsible content area) */}
             <div className={styles.commentsSection} hidden={!showComments}>
                 {/* Render content only when shown for performance */}
                {showComments && (
                    <>
                        {/* Conditionally render AddCommentForm only if user is logged in */}
                        {user && (
                            <AddCommentForm
                                connectionId={connection._id}
                                onCommentAdded={handleAddComment}
                            />
                        )}
                        {isLoadingComments && <div className={styles.commentLoading}><LoadingSpinner size="medium" /> Loading Comments...</div>}
                        {commentError && <div className={styles.commentError}>Error: {commentError}</div>}
                        {/* Render comment list only if not loading, no error, and comments have been fetched */}
                        {!isLoadingComments && !commentError && commentsFetched && (
                            <CommentList comments={comments} />
                        )}
                         {/* Show "No comments" only if not loading, no error, fetched, and array is empty */}
                         {!isLoadingComments && !commentError && commentsFetched && comments.length === 0 && (
                             <p className={styles.noCommentsYet}>No comments yet. {user ? 'Be the first to comment!' : 'Log in to comment.'}</p>
                         )}
                    </>
                )}
            </div>
        </article>
    );
};

export default ConnectionCard;