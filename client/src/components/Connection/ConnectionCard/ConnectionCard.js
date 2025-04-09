// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getCommentsForConnection, getStaticFileUrl } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import CommentList from '../../comments/CommentList';
import AddCommentForm from '../../comments/AddCommentForm';
import styles from './ConnectionCard.module.css'; // The CSS Module import

// Import React Icons
import {
    FaStar, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaRegCommentDots, FaTrashAlt, FaShareAlt,
    FaTwitter, // Will be used for 'X'
    FaFacebook, FaLink, FaTimes,
    FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp // <-- FaEnvelope REMOVED
} from 'react-icons/fa';


const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // Auth Context
    const { user, updateUserFavorites } = useAuth();

    // State Hooks
    const [isLiking, setIsLiking] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentsFetched, setCommentsFetched] = useState(false);

    // Share State
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const shareButtonRef = useRef(null);
    const shareOptionsRef = useRef(null);

    // Effect for closing share options on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShareOptions &&
                shareButtonRef.current && !shareButtonRef.current.contains(event.target) &&
                shareOptionsRef.current && !shareOptionsRef.current.contains(event.target))
            { setShowShareOptions(false); }
        };
        if (showShareOptions) { document.addEventListener('mousedown', handleClickOutside); }
        else { document.removeEventListener('mousedown', handleClickOutside); }
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, [showShareOptions]);


    // Callbacks/Memos (Comment logic unchanged)
    const handleToggleComments = useCallback(async () => {
        if (!connection?._id) { setCommentError("Cannot fetch comments: Connection ID is missing."); if (!showComments) setShowComments(true); setIsLoadingComments(false); return; }
        if (showComments) { setShowComments(false); return; }
        setShowComments(true);
        if (!commentsFetched || commentError) {
            setIsLoadingComments(true); setCommentError(null);
            try { const response = await getCommentsForConnection(connection._id); setComments(response.data || []); setCommentsFetched(true); }
            catch (err) { console.error("[handleToggleComments] Error fetching comments:", err); const message = err.response?.data?.message || err.message || "Failed to load comments."; setCommentError(message); setCommentsFetched(false); setComments([]); }
            finally { setIsLoadingComments(false); }
        }
    }, [showComments, commentsFetched, connection?._id, commentError]);

    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
        if (!commentsFetched) setCommentsFetched(true);
    }, [commentsFetched]);


    // Early return check (Unchanged)
    if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
        console.error("[ConnectionCard Render] Incomplete connection data, rendering error.", { connection });
        return <div className={styles.card}>Error: Incomplete connection data for ID {connection?._id}. Check console.</div>;
    }


    // Derived state (Unchanged)
    const isLikedByCurrentUser = !!user && !!connection.likes?.includes(user._id);
    const isFavoritedByCurrentUser = !!user && !!user.favorites && !!connection._id && user.favorites.includes(connection._id);
    const isOwner = !!user && user._id === connection.userRef._id;

    // Action Handlers (Like, Favorite, Delete - Unchanged)
    const handleLikeToggle = async () => {
        const currentConnectionId = connection?._id; if (!user || isLiking || !currentConnectionId) return; setIsLiking(true); setLocalError(null); try { const { data } = await api.post(`/connections/${currentConnectionId}/like`); if (onUpdate) onUpdate(data.connection); } catch (err) { console.error(`[handleLikeToggle - ${currentConnectionId}] Error:`, err); setLocalError("Failed to update like status."); } finally { setIsLiking(false); }
    };
    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id; if (!user || isFavoriting || !currentConnectionId) return; setIsFavoriting(true); setLocalError(null); try { const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`); updateUserFavorites(currentConnectionId); if (onUpdate) { onUpdate(updatedConnection); } } catch (err) { console.error(`[handleFavoriteToggle - ${currentConnectionId}] Favorite toggle error:`, err); setLocalError("Failed to update favorite status."); } finally { setIsFavoriting(false); }
    };
     const handleDelete = async () => {
        const currentConnectionId = connection?._id; if (!isOwner || isDeleting || !currentConnectionId || !window.confirm('Are you sure you want to delete this connection?')) return; setIsDeleting(true); setLocalError(null); try { await api.delete(`/connections/${currentConnectionId}`); if (user?.favorites?.includes(currentConnectionId)) { updateUserFavorites(currentConnectionId); } if (onDelete) onDelete(currentConnectionId); } catch (err) { const msg = err.response?.data?.message || err.message || "Failed to delete connection."; console.error(`[handleDelete - ${currentConnectionId}] Error:`, err); setLocalError(msg); setIsDeleting(false); }
    };

    // --- SHARE ACTION HANDLERS (Email Handler Removed) ---
    const baseUrl = window.location.origin; // Use base site URL
    const shareText = "Discover MovieBooks: Find books featured in your favorite movies!"; // Generic share text
    const siteTitle = "MovieBooks"; // For Reddit
    const siteLogoUrl = `${baseUrl}/MovieBooks-logo.jpg`; // For Pinterest

    const handleShareToggle = () => { setShowShareOptions(prev => !prev); setCopyStatus('Copy Link'); }; // Reset copy status on toggle

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(baseUrl); // Copy base URL
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        } catch (err) {
            console.error('Failed to copy link: ', err);
            setCopyStatus('Failed!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        }
    };

    const handleShareToX = () => {
        const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    const handleShareToFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    const handleShareToLinkedIn = () => {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`;
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    const handleShareToReddit = () => {
        const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(baseUrl)}&title=${encodeURIComponent(siteTitle)}`;
        window.open(redditUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    const handleShareToPinterest = () => {
        const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(baseUrl)}&media=${encodeURIComponent(siteLogoUrl)}&description=${encodeURIComponent(shareText)}`;
        window.open(pinterestUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    const handleShareToWhatsApp = () => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + baseUrl)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false);
    };

    // --- handleShareToEmail function REMOVED ---

    // --- END SHARE ACTION HANDLERS ---

    // --- JSX Return (Using the styles object) ---
    return (
        <article className={styles.card}> {/* Using styles.card */}
             {/* Header (Unchanged) */}
            <header className={styles.header}>
                 <h3>
                    <Link to={`/connections/${connection._id}`} className={styles.titleLink}>
                        {connection.movieRef.title} & {connection.bookRef.title}
                    </Link>
                </h3>
            </header>
            {/* Meta (Unchanged) */}
            <p className={styles.meta}>
                Added by{' '}
                <Link to={`/users/${connection.userRef._id}`} className={styles.userLink}>{connection.userRef.username}</Link>
                {' on '}
                {new Date(connection.createdAt).toLocaleDateString()}
            </p>

            {/* Screenshot Section / Placeholder (Unchanged) */}
            {connection.screenshotUrl ? ( <Link to={`/connections/${connection._id}`} className={styles.imageLink}> <div className={styles.screenshotWrapper}> <img src={getStaticFileUrl(connection.screenshotUrl)} alt={`Scene from ${connection.movieRef.title} featuring ${connection.bookRef.title}`} className={styles.screenshot} loading="lazy" /> </div> </Link> ) : ( <div className={`${styles.screenshotWrapper} ${styles.noScreenshotPlaceholder}`}>No Screenshot Available</div> )}

            {/* Context (Unchanged) */}
            {connection.context && ( <p className={styles.context}>{connection.context}</p> )}

            {/* Additional Images (Unchanged) */}
            {(connection.movieRef?.posterPath || connection.bookRef?.coverPath) && ( <div className={styles.additionalImagesContainer}> {connection.movieRef?.posterPath && ( <Link to={`/movies/${connection.movieRef._id}`} title={connection.movieRef.title} className={styles.additionalImageWrapper}> <img src={getStaticFileUrl(connection.movieRef.posterPath)} alt={`${connection.movieRef.title} Poster`} className={styles.additionalImage} loading="lazy" /> </Link> )} {connection.bookRef?.coverPath && ( <Link to={`/books/${connection.bookRef._id}`} title={connection.bookRef.title} className={styles.additionalImageWrapper}> <img src={getStaticFileUrl(connection.bookRef.coverPath)} alt={`${connection.bookRef.title} Cover`} className={styles.additionalImage} loading="lazy" /> </Link> )} </div> )}

            {/* Footer Actions */}
            <footer className={styles.actions}>
                 {/* Like Button (Unchanged) */}
                <button className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`} onClick={handleLikeToggle} disabled={!user || isLiking} title={isLikedByCurrentUser ? "Unlike" : "Like"} aria-label={isLikedByCurrentUser ? `Unlike connection, currently ${connection.likes?.length || 0} likes` : `Like connection, currently ${connection.likes?.length || 0} likes`} aria-pressed={isLikedByCurrentUser} > {isLiking ? <LoadingSpinner size="small" inline /> : (isLikedByCurrentUser ? <FaThumbsUp /> : <FaRegThumbsUp />) } <span className={styles.count}>{connection.likes?.length || 0}</span> </button>
                {/* Favorite Button (Unchanged) */}
                <button className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`} onClick={handleFavoriteToggle} disabled={!user || isFavoriting} title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"} aria-label={isFavoritedByCurrentUser ? "Remove connection from Favorites" : "Add connection to Favorites"} aria-pressed={isFavoritedByCurrentUser} > {isFavoriting ? <LoadingSpinner size="small" inline /> : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />) } </button>
                {/* Comment Button (Unchanged) */}
                <button className={`${styles.actionButton} ${styles.commentButton}`} onClick={handleToggleComments} title={showComments ? "Hide Comments" : "Show Comments"} aria-label={showComments ? "Hide comments section" : "Show comments section"} aria-expanded={showComments} > <FaRegCommentDots /> </button>

                {/* --- SHARE BUTTON & OPTIONS (Email Option Removed from JSX) --- */}
                <div className={styles.shareActionWrapper}>
                    <button
                        ref={shareButtonRef}
                        className={`${styles.actionButton} ${styles.shareButton}`}
                        onClick={handleShareToggle}
                        title="Share MovieBooks" // Updated title
                        aria-label="Share MovieBooks site" // Updated label
                        aria-haspopup="true"
                        aria-expanded={showShareOptions}
                        aria-controls={`share-options-${connection._id}`}
                    >
                        <FaShareAlt />
                    </button>
                    {showShareOptions && (
                        <div
                            ref={shareOptionsRef}
                            id={`share-options-${connection._id}`}
                            className={styles.shareOptionsPopup}
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby={`share-button-${connection._id}`}
                        >
                            {/* Copy Link */}
                            <button role="menuitem" onClick={handleCopyToClipboard} className={styles.shareOptionButton}>
                                <FaLink className={styles.shareIcon} /> {copyStatus}
                            </button>
                             {/* Share to X */}
                             <button role="menuitem" onClick={handleShareToX} className={styles.shareOptionButton}>
                                <FaTwitter className={styles.shareIcon} /> X
                            </button>
                            {/* Share to Facebook */}
                            <button role="menuitem" onClick={handleShareToFacebook} className={styles.shareOptionButton}>
                                <FaFacebook className={styles.shareIcon} /> Facebook
                            </button>
                            {/* Share to LinkedIn */}
                            <button role="menuitem" onClick={handleShareToLinkedIn} className={styles.shareOptionButton}>
                                <FaLinkedin className={styles.shareIcon} /> LinkedIn
                            </button>
                            {/* Share to Reddit */}
                            <button role="menuitem" onClick={handleShareToReddit} className={styles.shareOptionButton}>
                                <FaRedditAlien className={styles.shareIcon} /> Reddit
                            </button>
                             {/* Share to Pinterest */}
                             <button role="menuitem" onClick={handleShareToPinterest} className={styles.shareOptionButton}>
                                <FaPinterest className={styles.shareIcon} /> Pinterest
                            </button>
                            {/* Share to WhatsApp */}
                            <button role="menuitem" onClick={handleShareToWhatsApp} className={styles.shareOptionButton}>
                                <FaWhatsapp className={styles.shareIcon} /> WhatsApp
                            </button>
                            {/* --- Share via Email Button REMOVED --- */}

                            {/* Close Button (Unchanged) */}
                            <button
                                onClick={() => setShowShareOptions(false)}
                                className={`${styles.shareOptionButton} ${styles.closeShareButton}`}
                                title="Close share options"
                                aria-label="Close share options"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>
                {/* --- END SHARE BUTTON & OPTIONS --- */}

                {/* Delete Button (Unchanged) */}
                {isOwner && ( <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete} disabled={isDeleting} title="Delete Connection" aria-label="Delete this connection" > {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} </button> )}
                {/* Local Error (Unchanged) */}
                {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            {/* --- Comments Section (Unchanged) --- */}
             <div className={styles.commentsSection} hidden={!showComments}>
                {showComments && (
                    <>
                        {user && ( <AddCommentForm connectionId={connection._id} onCommentAdded={handleAddComment} /> )}
                        {isLoadingComments && ( <div className={styles.commentLoading}> <LoadingSpinner size="medium" /> Loading Comments... </div> )}
                        {commentError && !isLoadingComments && ( <div className={styles.commentError}>Error: {commentError}</div> )}
                        {!isLoadingComments && !commentError && commentsFetched && ( <CommentList comments={comments} /> )}
                         {!isLoadingComments && !commentError && commentsFetched && comments.length === 0 && ( <p className={styles.noCommentsYet}> No comments yet. {user ? 'Be the first to comment!' : 'Log in to comment.'} </p> )}
                    </>
                )}
            </div>
            {/* --- END Comments Section --- */}
        </article>
    );
};

export default ConnectionCard;