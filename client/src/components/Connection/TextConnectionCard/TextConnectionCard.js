// client/src/components/Connection/TextConnectionCard/TextConnectionCard.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Removed useNavigate import
import {
    FaRegCommentAlt, FaShareAlt, FaTrashAlt, FaTwitter, FaFacebook,
    FaLink, FaTimes, FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp,
    FaStar, FaRegStar // Import Star icons for Favorite
} from 'react-icons/fa';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getStaticFileUrl, getCommentsForConnection } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import CommentList from '../../comments/CommentList';
import AddCommentForm from '../../comments/AddCommentForm';
import LikeButton from '../../Common/LikeButton/LikeButton';
import defaultAvatar from '../../../assets/images/default-avatar.png';
import styles from './TextConnectionCard.module.css';

const TextConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // --- HOOK CALLS AT THE TOP ---
    // Removed: const navigate = useNavigate();
    const { user, updateUserFavorites } = useAuth();

    // --- STATE ---
    const [isDeleting, setIsDeleting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentsFetched, setCommentsFetched] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);

    // --- REFS ---
    const shareButtonRef = useRef(null);
    const shareOptionsRef = useRef(null);

    // --- EFFECTS ---

    // Effect for closing share options popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the share button AND the share options popup
            if (showShareOptions &&
                shareButtonRef.current && !shareButtonRef.current.contains(event.target) &&
                shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
                setShowShareOptions(false);
            }
        };

        if (showShareOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup listener on component unmount or when showShareOptions changes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShareOptions]); // Re-run effect only when showShareOptions changes


    // --- ACTION HANDLERS (DEFINED BEFORE EARLY RETURN) ---

    // Toggle Comments Visibility & Fetch if Needed
    const handleToggleComments = useCallback(async () => {
        const currentConnectionId = connection?._id;
        if (!currentConnectionId) {
            setCommentError("Cannot fetch comments: Connection ID is missing.");
            if (!showComments) setShowComments(true); // Still show the area even with error
            setIsLoadingComments(false);
            return;
        }

        // If comments are currently visible, just hide them
        if (showComments) {
            setShowComments(false);
            return;
        }

        // If comments are not visible, show them
        setShowComments(true);

        // Fetch comments only if they haven't been fetched successfully before
        if (!commentsFetched || commentError) {
            setIsLoadingComments(true);
            setCommentError(null); // Clear previous error
            try {
                const response = await getCommentsForConnection(currentConnectionId);
                setComments(response.data || []);
                setCommentsFetched(true); // Mark as fetched on success
            } catch (err) {
                console.error("[TextConnectionCard - handleToggleComments] Error fetching comments:", err);
                const message = err.response?.data?.message || err.message || "Failed to load comments.";
                setCommentError(message);
                setCommentsFetched(false); // Allow refetch on next toggle if error occurred
                setComments([]); // Clear potentially stale comments on error
            } finally {
                setIsLoadingComments(false);
            }
        }
        // If comments were already fetched successfully, just showing them (setShowComments(true) above) is enough.
    }, [showComments, commentsFetched, connection?._id, commentError]);

    // Add a new comment locally
    const handleAddComment = useCallback((newComment) => {
        setComments(prevComments => [newComment, ...prevComments]); // Add to the top
        if (!commentsFetched) setCommentsFetched(true); // Mark as fetched if this is the first comment
        if (!showComments) setShowComments(true); // Ensure comments section is visible
    }, [commentsFetched, showComments]);

    // Toggle Favorite Status
    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id;
        if (!user || isFavoriting || !currentConnectionId) {
            console.warn("[TextConnectionCard - handleFavoriteToggle] Aborting - User not logged in, already processing, or missing connection ID.");
            return;
        }
        setIsFavoriting(true);
        setLocalError(null);
        try {
            console.log(`[TextConnectionCard - handleFavoriteToggle] Toggling favorite for ID: ${currentConnectionId}`);
            const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`);

            if (typeof updateUserFavorites === 'function') {
                updateUserFavorites(currentConnectionId); // Update context
            } else {
                console.warn("[TextConnectionCard - handleFavoriteToggle] updateUserFavorites function not available from AuthContext");
            }

            if (onUpdate) {
                onUpdate(updatedConnection); // Notify parent (e.g., Feed)
            } else {
                console.warn("[TextConnectionCard - handleFavoriteToggle] onUpdate prop is missing!");
            }

        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to update favorite status.";
            console.error(`[TextConnectionCard - handleFavoriteToggle - ${currentConnectionId}] Error:`, err);
            setLocalError(msg);
        } finally {
            setIsFavoriting(false);
        }
    };

    // --- SHARE ACTION HANDLERS ---
    const connectionUrl = `${window.location.origin}/connections/${connection?._id}`;
    const shareText = `Check out this connection on MovieBooks: ${connection?.context?.substring(0, 50) || ''}...`;

    const handleShareToggle = () => { setShowShareOptions(prev => !prev); setCopyStatus('Copy Link'); };
    const handleCopyToClipboard = async () => { try { await navigator.clipboard.writeText(connectionUrl); setCopyStatus('Copied!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } catch (err) { console.error('[TextConnectionCard] Failed to copy link: ', err); setCopyStatus('Failed!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } };
    const createShareHandler = (urlTemplate) => () => { window.open(urlTemplate, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToX = createShareHandler(`https://twitter.com/intent/tweet?url=${encodeURIComponent(connectionUrl)}&text=${encodeURIComponent(shareText)}`);
    const handleShareToFacebook = createShareHandler(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(connectionUrl)}`);
    const handleShareToLinkedIn = createShareHandler(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(connectionUrl)}`);
    const handleShareToReddit = createShareHandler(`https://www.reddit.com/submit?url=${encodeURIComponent(connectionUrl)}&title=${encodeURIComponent('MovieBooks Connection')}`);
    const handleShareToPinterest = () => { const mediaUrl = `${window.location.origin}/MovieBooks-logo.jpg`; const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(connectionUrl)}&media=${encodeURIComponent(mediaUrl)}&description=${encodeURIComponent(shareText)}`; window.open(pinterestUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToWhatsApp = createShareHandler(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + connectionUrl)}`);

    // --- DELETE HANDLER ---
    const handleDelete = async () => {
        const currentConnectionId = connection?._id;
        // Check ownership, deletion status, and ID existence before proceeding
        const isOwner = !!user && user._id === connection?.userRef?._id; // Recalculate here for safety
        if (!isOwner || isDeleting || !currentConnectionId) {
            console.log('[TextCard handleDelete] Aborting - Pre-condition failed (Not owner, already deleting, or no ID).');
            return;
        }
        // User confirmation
        if (!window.confirm('Are you sure you want to delete this post?')) {
            console.log('[TextCard handleDelete] Aborting - User cancelled confirm dialog.');
            return;
        }

        setIsDeleting(true);
        setLocalError(null);
        try {
            console.log('[TextCard handleDelete] Sending DELETE request for ID:', currentConnectionId);
            await api.delete(`/connections/${currentConnectionId}`);
            console.log('[TextCard handleDelete] API call successful.');

            // Clean up favorites in context if needed
            if (user?.favorites?.includes(currentConnectionId)) {
                if (typeof updateUserFavorites === 'function') {
                    updateUserFavorites(currentConnectionId);
                } else {
                    console.warn("[TextCard handleDelete] updateUserFavorites function not available from AuthContext for delete cleanup");
                }
            }

            // Notify parent component (e.g., Feed) to remove the card
            if (onDelete) {
                console.log('[TextCard handleDelete] Calling parent onDelete prop.');
                onDelete(currentConnectionId);
            } else {
                console.warn('[TextCard handleDelete] onDelete prop is missing!');
            }
            // No need to set isDeleting back to false if the component is removed by onDelete

        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete post.";
            console.error(`[TextCard handleDelete - ${currentConnectionId}] Error:`, err);
            setLocalError(msg);
            setIsDeleting(false); // Only set back to false on error
        }
    };
    // --- END ACTION HANDLERS ---


    // --- DATA VALIDATION & EARLY RETURN ---
    // Ensure essential connection data and user reference details are present
    if (!connection || !connection._id || !connection.userRef || !connection.userRef._id || !connection.userRef.username) {
        console.warn('TextConnectionCard received incomplete connection data, or missing userRef details:', connection);
        // Render nothing if data is fundamentally missing
        return null;
    }

    // --- DESTRUCTURE DATA (SAFE AFTER CHECK) ---
    const {
        _id: connectionId,
        userRef,
        context,
        createdAt,
        likes = [], // Default to empty array if undefined
    } = connection;

    // --- DERIVED VALUES ---
    const isOwner = !!user && user._id === userRef._id;
    const timeAgo = formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true });
    const avatarUrl = userRef.profileImageUrl
        ? getStaticFileUrl(userRef.profileImageUrl)
        : defaultAvatar;
    const displayedUserName = userRef.username; // Use username as primary display name
    const isFavoritedByCurrentUser = !!user?.favorites?.includes(connectionId);


    // --- RENDER ---
    return (
        <div className={styles.card}>
            {/* User Info Header */}
            <div className={styles.userInfo}>
                <Link to={`/users/${userRef._id}`} className={styles.avatarLink}>
                    <img
                        src={avatarUrl}
                        alt={`${displayedUserName}'s avatar`}
                        className={styles.avatar}
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} // Fallback for broken image links
                    />
                </Link>
                <div className={styles.nameTime}>
                    <Link to={`/users/${userRef._id}`} className={styles.nameLink}>
                        {displayedUserName}
                    </Link>
                    <Link to={`/connections/${connectionId}`} className={styles.timestampLink} title="View connection details">
                        <span className={styles.timestamp}>{timeAgo}</span>
                    </Link>
                </div>
            </div>

            {/* Connection Context */}
            {context && (
                <div className={styles.context}>
                    <Link to={`/connections/${connectionId}`} className={styles.contextLink} title="View connection details">
                        {/* Using a paragraph for semantic text content */}
                        <p>{context}</p>
                    </Link>
                </div>
            )}

            {/* Action Bar */}
            <div className={styles.actions}>
                {/* Like Button */}
                <LikeButton
                    connectionId={connectionId}
                    initialLikes={likes}
                    onLikeUpdate={onUpdate} // Pass onUpdate to handle potential connection object updates
                />

                {/* Favorite Button */}
                <button
                    className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`}
                    onClick={handleFavoriteToggle}
                    disabled={!user || isFavoriting} // Disable if not logged in or during API call
                    title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"}
                    aria-label={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"}
                    aria-pressed={isFavoritedByCurrentUser} // Indicate state for screen readers
                >
                    {isFavoriting ? <LoadingSpinner size="small" inline /> : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />)}
                </button>

                {/* Comment Button */}
                <button
                    onClick={handleToggleComments}
                    className={styles.actionButton}
                    title={showComments ? "Hide Comments" : "Show Comments"}
                    aria-expanded={showComments} // Indicate state for screen readers
                    aria-controls={`comments-section-${connectionId}`} // Link button to the section it controls
                >
                    <FaRegCommentAlt />
                    {/* Potential future feature: Display comment count */}
                    {/* {connection.commentCount > 0 && <span className={styles.count}>{connection.commentCount}</span>} */}
                </button>

                {/* Right-aligned Actions (Share, Delete) */}
                <div className={styles.rightActions}>
                    {/* Share Button & Popup */}
                    <div className={styles.shareActionWrapper}> {/* Wrapper for positioning */}
                        <button
                            ref={shareButtonRef}
                            onClick={handleShareToggle}
                            className={`${styles.actionButton} ${styles.shareButton}`}
                            title="Share Post"
                            aria-label="Share this post"
                            aria-haspopup="menu" // Indicate it opens a menu
                            aria-expanded={showShareOptions} // Indicate if the menu is open
                            aria-controls={`share-options-${connectionId}`} // Link to the popup
                        >
                            <FaShareAlt />
                        </button>
                        {showShareOptions && (
                            <div
                                ref={shareOptionsRef}
                                id={`share-options-${connectionId}`}
                                className={styles.shareOptionsPopup}
                                role="menu" // Semantically a menu
                                aria-labelledby={shareButtonRef.current?.id || undefined} // Associate with the button that opened it (requires button to have an id)
                            >
                                {/* Using role="menuitem" for items within the menu */}
                                <button role="menuitem" onClick={handleCopyToClipboard} className={styles.shareOptionButton}> <FaLink className={styles.shareIcon} /> {copyStatus} </button>
                                <button role="menuitem" onClick={handleShareToX} className={styles.shareOptionButton}> <FaTwitter className={styles.shareIcon} /> X </button>
                                <button role="menuitem" onClick={handleShareToFacebook} className={styles.shareOptionButton}> <FaFacebook className={styles.shareIcon} /> Facebook </button>
                                <button role="menuitem" onClick={handleShareToLinkedIn} className={styles.shareOptionButton}> <FaLinkedin className={styles.shareIcon} /> LinkedIn </button>
                                <button role="menuitem" onClick={handleShareToReddit} className={styles.shareOptionButton}> <FaRedditAlien className={styles.shareIcon} /> Reddit </button>
                                <button role="menuitem" onClick={handleShareToPinterest} className={styles.shareOptionButton}> <FaPinterest className={styles.shareIcon} /> Pinterest </button>
                                <button role="menuitem" onClick={handleShareToWhatsApp} className={styles.shareOptionButton}> <FaWhatsapp className={styles.shareIcon} /> WhatsApp </button>
                                <button onClick={() => setShowShareOptions(false)} className={`${styles.shareOptionButton} ${styles.closeShareButton}`} title="Close share options" aria-label="Close share options"> <FaTimes /> </button>
                            </div>
                        )}
                    </div>

                    {/* Delete Button (Only shown to owner) */}
                    {isOwner && (
                        <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={handleDelete}
                            disabled={isDeleting} // Disable during API call
                            title="Delete Post"
                            aria-label="Delete this post"
                        >
                            {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />}
                        </button>
                    )}
                </div>
            </div> {/* End Actions */}

            {/* Display Action Errors (e.g., Favorite/Delete failure) */}
            {localError && <span className={styles.actionError}>{localError}</span>}

            {/* Comments Section Wrapper (Controls visibility transition) */}
            <div
                id={`comments-section-${connectionId}`} // ID for aria-controls
                className={`${styles.commentsSectionWrapper} ${showComments ? styles.commentsVisible : ''}`}
                // Use hidden attribute for better performance/accessibility when closed
                // It prevents rendering content inside, unlike just display: none
                hidden={!showComments}
            >
                {/* Conditional rendering inside the wrapper, only mount when shown */}
                {showComments && (
                    <>
                        {/* Add Comment Form (Only for logged-in users) */}
                        {user ? (
                            <AddCommentForm connectionId={connectionId} onCommentAdded={handleAddComment} />
                        ) : (
                            <p className={styles.noCommentsYet}>Log in to leave a comment.</p> // Slightly improved text
                        )}

                        {/* Loading/Error/List State for Comments */}
                        {isLoadingComments && (
                            <div className={styles.commentLoading}>
                                <LoadingSpinner size="medium" /> Loading Comments...
                            </div>
                        )}
                        {commentError && !isLoadingComments && (
                            <div className={styles.commentError}>Error: {commentError}</div>
                        )}
                        {!isLoadingComments && !commentError && commentsFetched && comments.length > 0 && (
                            <CommentList comments={comments} />
                        )}

                        {/* "No comments yet" messages (only shown after successful fetch) */}
                        {!isLoadingComments && !commentError && commentsFetched && comments.length === 0 && !user && (
                            <p className={styles.noCommentsYet}>No comments yet.</p>
                        )}
                        {!isLoadingComments && !commentError && commentsFetched && comments.length === 0 && user && (
                            <p className={styles.noCommentsYet}>No comments yet. Be the first!</p>
                        )}
                    </>
                )}
            </div> {/* End Comments Section */}

        </div> // End Card
    );
};

export default TextConnectionCard;
