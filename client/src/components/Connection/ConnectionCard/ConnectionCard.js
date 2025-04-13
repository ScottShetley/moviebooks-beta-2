// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
// ** Ensure 'api' is imported if it's used directly (it is for delete) **
import api, { getCommentsForConnection, getStaticFileUrl } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import CommentList from '../../comments/CommentList';
import AddCommentForm from '../../comments/AddCommentForm';
import LikeButton from '../../Common/LikeButton/LikeButton';
import styles from './ConnectionCard.module.css';

// Import React Icons
import {
    FaStar, FaRegStar, FaRegCommentDots, FaTrashAlt, FaShareAlt,
    FaTwitter, FaFacebook, FaLink, FaTimes,
    FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp,
    FaChevronDown, FaChevronUp
} from 'react-icons/fa';


const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // Auth Context
    const { user, updateUserFavorites } = useAuth(); // updateUserFavorites might be unused now? Check ESLint warning later

    // State Hooks
    const [isExpanded, setIsExpanded] = useState(false);
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

    // Effect for closing share options
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShareOptions && shareButtonRef.current && !shareButtonRef.current.contains(event.target) && shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
                 setShowShareOptions(false);
            }
        };
        if (showShareOptions) { document.addEventListener('mousedown', handleClickOutside); }
        else { document.removeEventListener('mousedown', handleClickOutside); }
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, [showShareOptions]);

    // Handler for Expansion
    const handleToggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    // Callbacks/Memos for Comments
    const handleToggleComments = useCallback(async () => {
        if (!connection?._id) { setCommentError("Cannot fetch comments: Connection ID is missing."); if (!showComments) setShowComments(true); setIsLoadingComments(false); return; }
        if (showComments) { setShowComments(false); return; }
        if (!isExpanded) { setIsExpanded(true); }
        setShowComments(true);
        if (!commentsFetched || commentError) {
            setIsLoadingComments(true); setCommentError(null);
            try { const response = await getCommentsForConnection(connection._id); setComments(response.data || []); setCommentsFetched(true); }
            catch (err) { console.error("[handleToggleComments] Error fetching comments:", err); const message = err.response?.data?.message || err.message || "Failed to load comments."; setCommentError(message); setCommentsFetched(false); setComments([]); }
            finally { setIsLoadingComments(false); }
        }
    }, [showComments, commentsFetched, connection?._id, commentError, isExpanded]);

    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
        if (!commentsFetched) setCommentsFetched(true);
        if (!isExpanded) setIsExpanded(true);
        if (!showComments) setShowComments(true);
    }, [commentsFetched, isExpanded, showComments]);

    // Early return check
    if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
        console.error("[ConnectionCard Render] Incomplete connection data, rendering error.", { connection });
        return <div className={styles.card}>Error: Incomplete connection data for ID {connection?._id}. Check console.</div>;
    }

    // Derived state
    const isFavoritedByCurrentUser = !!user && !!user.favorites && !!connection._id && user.favorites.includes(connection._id);
    const isOwner = !!user && user._id === connection.userRef._id;

    // Action Handlers
    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id;
        if (!user || isFavoriting || !currentConnectionId) return;
        setIsFavoriting(true); setLocalError(null);
        try {
            const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`);
            // ** Check if updateUserFavorites is defined before calling **
            if (typeof updateUserFavorites === 'function') {
                updateUserFavorites(currentConnectionId);
            } else {
                console.warn("updateUserFavorites function not available from AuthContext");
            }
            if (onUpdate) { onUpdate(updatedConnection); }
        } catch (err) {
            console.error(`[handleFavoriteToggle - ${currentConnectionId}] Favorite toggle error:`, err);
            setLocalError("Failed to update favorite status.");
        } finally {
            setIsFavoriting(false);
        }
    };

    // --- handleDelete with CONSOLE LOGS ---
    const handleDelete = async () => {
        const currentConnectionId = connection?._id;
        // --- DEBUG START ---
        console.log('[handleDelete] Clicked. isOwner:', isOwner, 'isDeleting:', isDeleting, 'ID:', currentConnectionId);
        if (!isOwner || isDeleting || !currentConnectionId) {
            console.log('[handleDelete] Aborting - Pre-condition failed.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this connection?')) {
             console.log('[handleDelete] Aborting - User cancelled confirm dialog.');
             return;
        }
        // --- DEBUG END ---

        setIsDeleting(true); // Set loading state
        setLocalError(null); // Clear previous errors

        try {
            console.log('[handleDelete] Sending DELETE request for ID:', currentConnectionId); // DEBUG
            await api.delete(`/connections/${currentConnectionId}`); // Ensure 'api' is imported
            console.log('[handleDelete] API call successful.'); // DEBUG

            // Handle User Favorites Update
            if (user?.favorites?.includes(currentConnectionId)) {
                // Check if updateUserFavorites is defined before calling
                if (typeof updateUserFavorites === 'function') {
                    updateUserFavorites(currentConnectionId);
                 } else {
                     console.warn("updateUserFavorites function not available from AuthContext for delete cleanup");
                 }
            }

            // Call parent handler to remove from list
            if (onDelete) {
                console.log('[handleDelete] Calling parent onDelete prop.'); // DEBUG
                onDelete(currentConnectionId); // Call the function passed from HomePage
            } else {
                console.warn('[handleDelete] onDelete prop is missing!'); // DEBUG WARNING
            }
            // Don't reset isDeleting on success, component should unmount
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete connection.";
            console.error(`[handleDelete - ${currentConnectionId}] Error:`, err);
            setLocalError(msg); // Show error to user
            setIsDeleting(false); // Reset loading state ONLY on error
        }
    };
    // --- END handleDelete ---

    // SHARE ACTION HANDLERS (Unchanged)
    const baseUrl = window.location.origin;
    const handleShareToggle = () => { setShowShareOptions(prev => !prev); setCopyStatus('Copy Link'); };
    const handleCopyToClipboard = async () => { try { await navigator.clipboard.writeText(baseUrl); setCopyStatus('Copied!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } catch (err) { console.error('Failed to copy link: ', err); setCopyStatus('Failed!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } };
    const handleShareToX = () => { const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(baseUrl)}&text=Discover MovieBooks: Find books featured in your favorite movies!`; window.open(xUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToFacebook = () => { const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`; window.open(facebookUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToLinkedIn = () => { const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`; window.open(linkedInUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToReddit = () => { const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(baseUrl)}&title=MovieBooks`; window.open(redditUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToPinterest = () => { const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(baseUrl)}&media=${encodeURIComponent(baseUrl + '/MovieBooks-logo.jpg')}&description=Discover MovieBooks: Find books featured in your favorite movies!`; window.open(pinterestUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToWhatsApp = () => { const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Discover MovieBooks: Find books featured in your favorite movies!' + ' ' + baseUrl)}`; window.open(whatsappUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    // END SHARE ACTION HANDLERS

    // --- JSX Return ---
    return (
        <article className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}>
            <header className={styles.header}>
                 <h3><Link to={`/connections/${connection._id}`} className={styles.titleLink}>{connection.movieRef.title} & {connection.bookRef.title}</Link></h3>
            </header>
            <p className={styles.meta}> Added by{' '} <Link to={`/users/${connection.userRef._id}`} className={styles.userLink}>{connection.userRef.username}</Link> {' on '} {new Date(connection.createdAt).toLocaleDateString()} </p>

            <div className={styles.contentWrapper}>
                <div onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "" : "Click to expand"}>
                    {connection.screenshotUrl ? ( <Link to={`/connections/${connection._id}`} className={styles.imageLink} onClick={(e) => e.stopPropagation()} > <div className={styles.screenshotWrapper}> <img src={getStaticFileUrl(connection.screenshotUrl)} alt={`Scene from ${connection.movieRef.title} featuring ${connection.bookRef.title}`} className={styles.screenshot} loading="lazy" /> </div> </Link> ) : ( <div className={`${styles.screenshotWrapper} ${styles.noScreenshotPlaceholder}`}>No Screenshot Available</div> )}
                </div>
                 {connection.context && ( <div onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "" : "Click to expand"}> <p className={styles.context}>{connection.context}</p> </div> )}
                 {(connection.movieRef?.posterPath || connection.bookRef?.coverPath) && ( <div className={styles.additionalImagesContainer} onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "" : "Click to expand"}> {connection.movieRef?.posterPath && ( <Link to={`/movies/${connection.movieRef._id}`} title={connection.movieRef.title} className={styles.additionalImageWrapper} onClick={(e) => e.stopPropagation()}> <img src={getStaticFileUrl(connection.movieRef.posterPath)} alt={`${connection.movieRef.title} Poster`} className={styles.additionalImage} loading="lazy" /> </Link> )} {connection.bookRef?.coverPath && ( <Link to={`/books/${connection.bookRef._id}`} title={connection.bookRef.title} className={styles.additionalImageWrapper} onClick={(e) => e.stopPropagation()}> <img src={getStaticFileUrl(connection.bookRef.coverPath)} alt={`${connection.bookRef.title} Cover`} className={styles.additionalImage} loading="lazy" /> </Link> )} </div> )}
            </div>

            <footer className={styles.actions}>
                <LikeButton connectionId={connection._id} initialLikes={connection.likes || []} onLikeUpdate={onUpdate} />
                <button className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`} onClick={handleFavoriteToggle} disabled={!user || isFavoriting} title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"} > {isFavoriting ? <LoadingSpinner size="small" inline /> : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />) } </button>
                <button className={`${styles.actionButton} ${styles.commentButton}`} onClick={handleToggleComments} title={showComments ? "Hide Comments" : "Show Comments"} aria-expanded={showComments} > <FaRegCommentDots /> </button>
                <div className={styles.shareActionWrapper}>
                    <button ref={shareButtonRef} className={`${styles.actionButton} ${styles.shareButton}`} onClick={handleShareToggle} title="Share MovieBooks" > <FaShareAlt /> </button>
                    {showShareOptions && ( <div ref={shareOptionsRef} id={`share-options-${connection._id}`} className={styles.shareOptionsPopup} role="menu" > <button role="menuitem" onClick={handleCopyToClipboard} className={styles.shareOptionButton}> <FaLink className={styles.shareIcon} /> {copyStatus} </button><button role="menuitem" onClick={handleShareToX} className={styles.shareOptionButton}> <FaTwitter className={styles.shareIcon} /> X </button><button role="menuitem" onClick={handleShareToFacebook} className={styles.shareOptionButton}> <FaFacebook className={styles.shareIcon} /> Facebook </button><button role="menuitem" onClick={handleShareToLinkedIn} className={styles.shareOptionButton}> <FaLinkedin className={styles.shareIcon} /> LinkedIn </button><button role="menuitem" onClick={handleShareToReddit} className={styles.shareOptionButton}> <FaRedditAlien className={styles.shareIcon} /> Reddit </button><button role="menuitem" onClick={handleShareToPinterest} className={styles.shareOptionButton}> <FaPinterest className={styles.shareIcon} /> Pinterest </button><button role="menuitem" onClick={handleShareToWhatsApp} className={styles.shareOptionButton}> <FaWhatsapp className={styles.shareIcon} /> WhatsApp </button><button onClick={() => setShowShareOptions(false)} className={`${styles.shareOptionButton} ${styles.closeShareButton}`} title="Close share options" > <FaTimes /> </button> </div> )}
                </div>
                 <button className={`${styles.actionButton} ${styles.expandButton}`} onClick={handleToggleExpand} title={isExpanded ? "Show less" : "Show more"} aria-expanded={isExpanded} > {isExpanded ? <FaChevronUp /> : <FaChevronDown />} <span className={styles.expandText}>{isExpanded ? "Less" : "More"}</span> </button>
                 {/* Ensure onClick={handleDelete} is present */}
                 {isOwner && ( <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete} disabled={isDeleting} title="Delete Connection" > {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} </button> )}
                 {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            <div className={`${styles.commentsSectionWrapper} ${isExpanded ? styles.commentsVisible : ''}`}>
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
            </div>
        </article>
    );
};

export default ConnectionCard;