// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getCommentsForConnection } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import CommentList from '../../comments/CommentList'; // Correct path: lowercase 'comments'
import AddCommentForm from '../../comments/AddCommentForm'; // Correct path: lowercase 'comments'
import styles from './ConnectionCard.module.css';

const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
    const { user } = useAuth();

    // State Hooks (must be at top)
    const [isLiking, setIsLiking] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentsFetched, setCommentsFetched] = useState(false);

    // Callbacks/Memos (before early returns)
    const handleToggleComments = useCallback(async () => {
        // --- DEBUG LOG START ---
        console.log("[handleToggleComments] Attempting action for connection ID:", connection?._id);
        // --- DEBUG LOG END ---

        if (!connection?._id) {
             console.error("[handleToggleComments] Cannot fetch comments: connection._id is missing or invalid!");
             setCommentError("Cannot fetch comments: Connection ID is missing."); // Show user error
             // Ensure comments section shows the error if toggled open
             if (!showComments) setShowComments(true);
             setIsLoadingComments(false);
             return;
        }

        if (showComments) {
            setShowComments(false);
            return;
        }

        setShowComments(true);
        if (!commentsFetched || commentError) {
            setIsLoadingComments(true);
            setCommentError(null);
            try {
                // Pass the confirmed valid-looking ID
                const response = await getCommentsForConnection(connection._id);
                setComments(response.data);
                setCommentsFetched(true);
            } catch (err) {
                console.error("[handleToggleComments] Error fetching comments:", err);
                 // Use the error message from the backend response if available
                const message = err.response?.data?.message || err.message || "Failed to load comments.";
                setCommentError(message);
                setCommentsFetched(false); // Allow retry on next toggle
            } finally {
                setIsLoadingComments(false);
            }
        }
        // If comments already fetched and no error, just toggling visibility is handled above
    }, [showComments, commentsFetched, connection?._id, commentError]); // Include all dependencies

    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
    }, []);

    // Early return for invalid data
    if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
        console.error("[ConnectionCard Render] Incomplete connection data:", connection);
        return <div className={styles.card}>Error: Incomplete connection data.</div>;
    }

    // Derived state
    const isLikedByCurrentUser = user && connection.likes?.includes(user._id);
    const isFavoritedByCurrentUser = user && user.favorites?.includes(connection._id);
    const isOwner = user && user._id === connection.userRef._id;

    // Action Handlers (like, favorite, delete)
    const handleLikeToggle = async () => {
        if (!user || isLiking || !connection?._id) return; // Add check for ID
        setIsLiking(true);
        setLocalError(null);
        try {
            const { data } = await api.post(`/connections/${connection._id}/like`);
            if (onUpdate) onUpdate(data.connection);
        } catch (err) { console.error("Like toggle error:", err); setLocalError("Failed to update like status."); }
        finally { setIsLiking(false); }
    };
    const handleFavoriteToggle = async () => {
        if (!user || isFavoriting || !connection?._id) return; // Add check for ID
        setIsFavoriting(true);
        setLocalError(null);
        try {
            const { data: updatedConnection } = await api.post(`/connections/${connection._id}/favorite`);
            if (onUpdate) onUpdate(updatedConnection);
            // TODO: Parent/Context needs to update user favorite state
        } catch (err) { console.error("Favorite toggle error:", err); setLocalError("Failed to update favorite status."); }
        finally { setIsFavoriting(false); }
    };
     const handleDelete = async () => {
        if (!isOwner || isDeleting || !connection?._id || !window.confirm('Are you sure?')) return; // Add check for ID
        setIsDeleting(true);
        setLocalError(null);
        try {
            await api.delete(`/connections/${connection._id}`);
            if (onDelete) onDelete(connection._id);
        } catch (err) { const msg = err.response?.data?.message || err.message || "Failed to delete."; console.error("Delete error:", err); setLocalError(msg); setIsDeleting(false); }
         // No finally needed if component unmounts on success
    };

    // JSX Return
    return (
        <article className={styles.card}>
             {/* Header */}
            <header className={styles.header}>
                 <h3>
                    <Link to={`/movies/${connection.movieRef._id}`}>{connection.movieRef.title}</Link>
                    {' & '}
                    <Link to={`/books/${connection.bookRef._id}`}>{connection.bookRef.title}</Link>
                </h3>
            </header>
            {/* Meta */}
            <p className={styles.meta}>
                Added by{' '}
                <Link to={`/profile/${connection.userRef._id}`}>{connection.userRef.username}</Link>
                {' on '}
                {new Date(connection.createdAt).toLocaleDateString()}
            </p>

            {/* Screenshot Section (Using connection.screenshotUrl) */}
            {connection.screenshotUrl ? (
                <img
                    src={connection.screenshotUrl}
                    alt={`Scene from ${connection.movieRef.title} featuring ${connection.bookRef.title}`}
                    className={styles.screenshot}
                    loading="lazy"
                />
            ) : (
                 <div className={styles.noScreenshotPlaceholder}>No Screenshot Available</div>
            )}

            {/* Context */}
            {connection.context && ( <p className={styles.context}>{connection.context}</p> )}

            {/* Additional Images (Using connection.moviePosterUrl, connection.bookCoverUrl) */}
            {(connection.moviePosterUrl || connection.bookCoverUrl) && (
                <div className={styles.additionalImagesContainer}>
                    {connection.moviePosterUrl && (
                        <img
                            src={connection.moviePosterUrl}
                            alt={`${connection.movieRef.title} Poster`}
                            className={styles.additionalImage}
                            loading="lazy" />
                    )}
                    {connection.bookCoverUrl && (
                        <img
                            src={connection.bookCoverUrl}
                            alt={`${connection.bookRef.title} Cover`}
                            className={styles.additionalImage}
                            loading="lazy" />
                    )}
                </div>
             )}

            {/* Footer Actions */}
            <footer className={styles.actions}>
                <button className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`} onClick={handleLikeToggle} disabled={!user || isLiking} title={isLikedByCurrentUser ? "Unlike" : "Like"} > {isLiking ? <LoadingSpinner size="small" inline /> : '👍'} <span className={styles.count}>{connection.likes?.length || 0}</span> </button>
                <button className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`} onClick={handleFavoriteToggle} disabled={!user || isFavoriting} title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"} > {isFavoriting ? <LoadingSpinner size="small" inline /> : '⭐'} </button>
                <button className={`${styles.actionButton} ${styles.commentButton}`} onClick={handleToggleComments} title={showComments ? "Hide Comments" : "Show Comments"} > 💬 </button>
                {isOwner && ( <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete} disabled={isDeleting} title="Delete Connection" > {isDeleting ? <LoadingSpinner size="small" inline /> : '🗑️'} </button> )}
                {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            {/* Comments Section */}
            <div className={styles.commentsSection}>
                {showComments && (
                    <>
                        {user && (
                            <AddCommentForm
                                connectionId={connection._id} // Ensure this ID is valid when form renders
                                onCommentAdded={handleAddComment}
                            />
                        )}
                        {isLoadingComments && <div className={styles.commentLoading}><LoadingSpinner size="medium" /> Loading Comments...</div>}
                        {commentError && <div className={styles.commentError}>Error: {commentError}</div>}
                        {!isLoadingComments && !commentError && commentsFetched && (
                            <CommentList comments={comments} />
                        )}
                         {!isLoadingComments && !commentError && commentsFetched && comments.length === 0 && (
                             <p className={styles.noCommentsYet}>No comments yet.</p>
                         )}
                    </>
                )}
            </div>
        </article>
    );
};

export default ConnectionCard;