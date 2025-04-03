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
    const { user, updateUserFavorites } = useAuth();

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
    console.log(`[ConnectionCard Render START] Connection ID: ${connection?._id}`, { connection });

    // --- Callbacks/Memos ---
    const handleToggleComments = useCallback(async () => {
        console.log("[handleToggleComments] Attempting action for connection ID:", connection?._id);
        if (!connection?._id) {
             console.error("[handleToggleComments] Cannot fetch comments: connection._id is missing or invalid!");
             setCommentError("Cannot fetch comments: Connection ID is missing.");
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
                const response = await getCommentsForConnection(connection._id);
                setComments(response.data);
                setCommentsFetched(true);
            } catch (err) {
                console.error("[handleToggleComments] Error fetching comments:", err);
                const message = err.response?.data?.message || err.message || "Failed to load comments.";
                setCommentError(message);
                setCommentsFetched(false);
            } finally {
                setIsLoadingComments(false);
            }
        }
    }, [showComments, commentsFetched, connection?._id, commentError]);

    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
    }, []);

    // --- Early return for invalid data ---
    if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
        console.error("[ConnectionCard Render] Incomplete connection data, rendering error.", { connection });
        return <div className={styles.card}>Error: Incomplete connection data.</div>;
    }

    // --- Log Input Data for isFavoritedByCurrentUser ---
    console.log(`[ConnectionCard Fav Check - ${connection?._id}] User object:`, user);
    const connectionIdToCheck = connection?._id; // Store ID for clarity in logs
    let userFavoritesArray = null;
    if (user && user.favorites) {
        userFavoritesArray = user.favorites;
        console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] User Favorites Array:`, userFavoritesArray);
        console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] Connection ID to check:`, connectionIdToCheck);
    } else {
        console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] User or user.favorites is missing.`);
    }

    // --- Derived state Calculation & Logging ---
    const isLikedByCurrentUser = user && connection.likes?.includes(user._id);

    let includesResult = false; // Default to false
    if(user && userFavoritesArray && connectionIdToCheck) {
        includesResult = userFavoritesArray.includes(connectionIdToCheck);
        console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] Result of userFavorites.includes(connectionId):`, includesResult);
    } else {
         console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] Skipping includes() check due to missing user, favorites, or connection ID.`);
    }

    const isFavoritedByCurrentUser = user && userFavoritesArray && connectionIdToCheck && includesResult;
    console.log(`[ConnectionCard Fav Check - ${connectionIdToCheck}] FINAL calculated isFavoritedByCurrentUser:`, isFavoritedByCurrentUser);

    const isOwner = user && user._id === connection.userRef._id;

    // --- Action Handlers ---
    const handleLikeToggle = async () => {
         if (!user || isLiking || !connection?._id) return;
        setIsLiking(true);
        setLocalError(null);
        try {
            const { data } = await api.post(`/connections/${connection._id}/like`);
            if (onUpdate) onUpdate(data.connection);
        } catch (err) { console.error("Like toggle error:", err); setLocalError("Failed to update like status."); }
        finally { setIsLiking(false); }
    };

    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id; // Capture ID for logs
        console.log(`[handleFavoriteToggle - ${currentConnectionId}] Clicked. User logged in: ${!!user}. Is Favoriting: ${isFavoriting}`);
        if (!user || isFavoriting || !currentConnectionId) return;
        setIsFavoriting(true);
        setLocalError(null);
        try {
            console.log(`[handleFavoriteToggle - ${currentConnectionId}] Sending API request...`);
            const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`);
            console.log(`[handleFavoriteToggle - ${currentConnectionId}] API success. Response:`, updatedConnection);

            console.log(`[handleFavoriteToggle - ${currentConnectionId}] Calling updateUserFavorites from context...`);
            updateUserFavorites(currentConnectionId); // Call context function

            if (onUpdate) {
                console.log(`[handleFavoriteToggle - ${currentConnectionId}] Calling onUpdate prop...`);
                onUpdate(updatedConnection);
            }
        } catch (err) {
            console.error(`[handleFavoriteToggle - ${currentConnectionId}] Favorite toggle error:`, err);
            setLocalError("Failed to update favorite status.");
        } finally {
            console.log(`[handleFavoriteToggle - ${currentConnectionId}] Setting isFavoriting to false.`);
            setIsFavoriting(false);
        }
    };

     const handleDelete = async () => {
          if (!isOwner || isDeleting || !connection?._id || !window.confirm('Are you sure?')) return;
        setIsDeleting(true);
        setLocalError(null);
        try {
            await api.delete(`/connections/${connection._id}`);
            if (onDelete) onDelete(connection._id);
        } catch (err) { const msg = err.response?.data?.message || err.message || "Failed to delete."; console.error("Delete error:", err); setLocalError(msg); setIsDeleting(false); }
    };

    // --- Log Component Render End ---
    console.log(`[ConnectionCard Render END - ${connection?._id}] Rendering with isFavorited: ${isFavoritedByCurrentUser}`);

    // --- JSX Return ---
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

            {/* Screenshot Section */}
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

            {/* Additional Images */}
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

            {/* Footer Actions (Using React Icons) */}
            <footer className={styles.actions}>
                {/* Like Button */}
                <button
                    className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`}
                    onClick={handleLikeToggle}
                    disabled={!user || isLiking}
                    title={isLikedByCurrentUser ? "Unlike" : "Like"}
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
                >
                    {isFavoriting
                        ? <LoadingSpinner size="small" inline />
                        : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />) // Conditional Icon
                    }
                </button>

                {/* Comment Button */}
                <button
                    className={`${styles.actionButton} ${styles.commentButton}`}
                    onClick={handleToggleComments}
                    title={showComments ? "Hide Comments" : "Show Comments"}
                >
                    <FaRegCommentDots /> {/* Comment Icon */}
                </button>

                {/* Delete Button */}
                {isOwner && (
                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Delete Connection"
                    >
                        {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} {/* Delete Icon */}
                    </button>
                )}
                {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            {/* Comments Section */}
             <div className={styles.commentsSection}>
                {showComments && (
                    <>
                        {user && (
                            <AddCommentForm
                                connectionId={connection._id}
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