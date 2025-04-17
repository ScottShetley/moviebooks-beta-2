// client/src/components/Connection/TextConnectionCard/TextConnectionCard.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaRegCommentDots, // Icon matches ConnectionCard
    FaShareAlt, FaTrashAlt, FaTwitter, FaFacebook,
    FaLink, FaTimes, FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp,
    FaStar, FaRegStar
} from 'react-icons/fa';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getStaticFileUrl } from '../../../services/api';
import LikeButton from '../../Common/LikeButton/LikeButton';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import AddCommentForm from '../../comments/AddCommentForm'; // Using your existing comment form
import defaultAvatar from '../../../assets/images/default-avatar.png';
import styles from './TextConnectionCard.module.css';

const TextConnectionCard = ({ connection, onUpdate, onDelete }) => {
    const navigate = useNavigate();
    const { user, updateUserFavorites } = useAuth();

    // State for Delete
    const [isDeleting, setIsDeleting] = useState(false);
    const [localError, setLocalError] = useState(null); // For non-comment errors

    // State and Refs for Share Popup
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const shareButtonRef = useRef(null);
    const shareOptionsRef = useRef(null);

    // State for Favorite Button
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [isFavoritedByCurrentUser, setIsFavoritedByCurrentUser] = useState(false);

    // State for Commenting
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentCount, setCommentCount] = useState(
        connection?.commentCount ?? connection?.comments?.length ?? 0
    );

    // Effect for closing share options popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShareOptions]);

    // Effect to determine if the current user has favorited this connection
    useEffect(() => {
        setIsFavoritedByCurrentUser(
            !!user &&
            !!user.favorites &&
            !!connection?._id &&
            user.favorites.includes(connection._id)
        );
    }, [user, connection?._id]);

    // Basic check for required connection data
    if (!connection || !connection.userRef || !connection._id) {
        console.warn('TextConnectionCard received incomplete connection data:', connection);
        return null; // Don't render if essential data is missing
    }

    // Destructure connection data for easier access
    const {
        _id: connectionId,
        userRef,
        context,
        createdAt,
        likes = [], // Default to empty array if undefined
    } = connection;

    // Derived values for rendering
    const isOwner = !!user && user._id === userRef._id;
    const timeAgo = formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true });
    const avatarUrl = userRef.profileImageUrl
        ? getStaticFileUrl(userRef.profileImageUrl)
        : defaultAvatar;
    // --- UPDATED: Prioritize username ---
    const nameToShow = userRef.username || userRef.displayName || 'User';
    // ------------------------------------

    // --- ACTION HANDLERS ---

    // Navigate to connection details page when context is clicked
    const handleContextClick = () => {
        navigate(`/connections/${connectionId}`);
    };

    // Toggle the visibility of the comment input form
    const handleToggleCommentInput = () => {
        setShowCommentInput(prev => !prev);
        setLocalError(null); // Clear non-comment errors when toggling
    };

    // Handler called by AddCommentForm upon successful comment submission
    const handleCommentAdded = (newComment) => {
        setCommentCount(prevCount => prevCount + 1); // Increment local count
        setShowCommentInput(false); // Hide the form
        // Notify parent component (e.g., Feed) about the update
        if (onUpdate) {
            // Pass necessary info, like the updated count
            onUpdate({ ...connection, commentCount: commentCount + 1 });
        }
    };

    // Handle toggling the favorite status
    const handleFavoriteToggle = async () => {
        if (!user || isFavoriting || !connectionId) return; // Prevent multiple clicks or action without user/ID
        setIsFavoriting(true);
        setLocalError(null);
        const wasFavorited = isFavoritedByCurrentUser; // Store current state for potential revert

        // Optimistic UI update
        setIsFavoritedByCurrentUser(prev => !prev);
        if (typeof updateUserFavorites === 'function') {
             updateUserFavorites(connectionId); // Update context optimistically
        }

        try {
            // Make API call
            await api.post(`/connections/${connectionId}/favorite`);
            // No need to call onUpdate here if context update handles re-render,
            // but you could if the parent needs the full updated connection object:
            // const { data: updatedConnection } = await api.post(...);
            // if (onUpdate) onUpdate(updatedConnection);
        } catch (err) {
            console.error(`Favorite toggle error:`, err);
            setLocalError("Failed to update favorite status.");
            // Revert optimistic updates on error
            setIsFavoritedByCurrentUser(wasFavorited);
            if (typeof updateUserFavorites === 'function') {
                 updateUserFavorites(connectionId); // Call again to revert context state
            }
        } finally {
            setIsFavoriting(false); // Re-enable button
        }
    };

    // --- Share Handlers ---
    const connectionUrl = `${window.location.origin}/connections/${connectionId}`;
    const shareText = `Check out this connection on MovieBooks: ${connection.context?.substring(0, 100) || ''}...`; // Slightly longer preview

    const handleShareToggle = () => {
        setShowShareOptions(prev => !prev);
        setCopyStatus('Copy Link'); // Reset copy button text
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(connectionUrl);
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000); // Reset after 2s
        } catch (err) {
            console.error('Failed to copy link: ', err);
            setCopyStatus('Failed!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        }
    };

    // Functions to open share URLs in a new tab
    const openShareWindow = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        setShowShareOptions(false); // Close popup after sharing
    };

    const handleShareToX = () => openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(connectionUrl)}&text=${encodeURIComponent(shareText)}`);
    const handleShareToFacebook = () => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(connectionUrl)}`);
    const handleShareToLinkedIn = () => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(connectionUrl)}`);
    const handleShareToReddit = () => openShareWindow(`https://www.reddit.com/submit?url=${encodeURIComponent(connectionUrl)}&title=${encodeURIComponent('MovieBooks Connection')}`);
    const handleShareToPinterest = () => openShareWindow(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(connectionUrl)}&media=${encodeURIComponent(window.location.origin + '/MovieBooks-logo.jpg')}&description=${encodeURIComponent(shareText)}`); // Assumes logo exists
    const handleShareToWhatsApp = () => openShareWindow(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + connectionUrl)}`);
    // --- End Share Handlers ---

    // Handle deleting the connection
    const handleDelete = async () => {
        if (!isOwner || isDeleting || !connectionId) return; // Safety checks
        // Confirmation dialog
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }
        setIsDeleting(true);
        setLocalError(null);
        try {
            await api.delete(`/connections/${connectionId}`);
            // Notify parent component to remove the card from the list
            if (onDelete) {
                onDelete(connectionId);
            }
            // Clean up favorite status in context if needed
            if (user?.favorites?.includes(connectionId) && typeof updateUserFavorites === 'function') {
                updateUserFavorites(connectionId);
            }
        } catch (err) {
            console.error(`Delete connection error:`, err);
            setLocalError(err.response?.data?.message || "Failed to delete post.");
            setIsDeleting(false); // Only reset loading state on error
        }
        // Don't set isDeleting to false on success, as the component should unmount
    };

    // --- RENDER ---
    return (
        <div className={styles.card}>
            {/* User Info Header */}
            <div className={styles.userInfo}>
                <Link to={`/users/${userRef._id}`} className={styles.avatarLink}>
                    <img
                        src={avatarUrl}
                        alt={`${nameToShow}'s avatar`} // <-- Use nameToShow
                        className={styles.avatar}
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} // Fallback if image fails
                    />
                </Link>
                <div className={styles.nameTime}>
                    <Link to={`/users/${userRef._id}`} className={styles.nameLink}>{nameToShow}</Link> {/* <-- Use nameToShow */}
                    <Link to={`/connections/${connectionId}`} className={styles.timestampLink}>
                        <span className={styles.timestamp}>{timeAgo}</span>
                    </Link>
                </div>
            </div>

            {/* Connection Context */}
            {context && (
                <div
                    className={styles.context}
                    onClick={handleContextClick} // Navigate on click
                    style={{ cursor: 'pointer' }}
                    title="View connection details"
                >
                    <p>{context}</p>
                </div>
            )}

            {/* Action Bar */}
            <div className={styles.actions}>
                {/* Like Button */}
                <LikeButton
                    connectionId={connectionId}
                    initialLikes={likes}
                    onLikeUpdate={onUpdate} // Pass the update handler down
                />

                {/* Favorite Button */}
                <button
                    className={`${styles.actionButton} ${styles.favoriteButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`}
                    onClick={handleFavoriteToggle}
                    disabled={!user || isFavoriting} // Disable if not logged in or during API call
                    title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"}
                    aria-label={isFavoritedByCurrentUser ? "Remove from favorites" : "Add to favorites"}
                >
                    {isFavoriting ? <LoadingSpinner size="small" inline /> : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />)}
                </button>

                {/* Comment Button (Toggles Input) */}
                <button
                    onClick={handleToggleCommentInput}
                    className={`${styles.actionButton} ${styles.commentButton}`}
                    title={showCommentInput ? "Cancel comment" : "Comment"}
                    aria-expanded={showCommentInput}
                    // AddCommentForm handles its own submit disabling, so no need here
                >
                    <FaRegCommentDots /> {/* Icon matches ConnectionCard */}
                    {commentCount > 0 && <span className={styles.commentCount}>{commentCount}</span>}
                </button>

                {/* Share Button & Popup */}
                <div className={styles.shareActionWrapper}>
                    <button
                        ref={shareButtonRef}
                        onClick={handleShareToggle}
                        className={`${styles.actionButton} ${styles.shareButton}`}
                        title="Share Post"
                        aria-label="Share this post"
                        aria-haspopup="true"
                        aria-expanded={showShareOptions}
                    >
                        <FaShareAlt />
                    </button>
                    {showShareOptions && (
                        <div ref={shareOptionsRef} id={`share-options-${connectionId}`} className={styles.shareOptionsPopup} role="menu">
                            <button role="menuitem" onClick={handleCopyToClipboard} className={styles.shareOptionButton}> <FaLink className={styles.shareIcon} /> {copyStatus} </button>
                            <button role="menuitem" onClick={handleShareToX} className={styles.shareOptionButton}> <FaTwitter className={styles.shareIcon} /> X </button>
                            <button role="menuitem" onClick={handleShareToFacebook} className={styles.shareOptionButton}> <FaFacebook className={styles.shareIcon} /> Facebook </button>
                            <button role="menuitem" onClick={handleShareToLinkedIn} className={styles.shareOptionButton}> <FaLinkedin className={styles.shareIcon} /> LinkedIn </button>
                            <button role="menuitem" onClick={handleShareToReddit} className={styles.shareOptionButton}> <FaRedditAlien className={styles.shareIcon} /> Reddit </button>
                            <button role="menuitem" onClick={handleShareToPinterest} className={styles.shareOptionButton}> <FaPinterest className={styles.shareIcon} /> Pinterest </button>
                            <button role="menuitem" onClick={handleShareToWhatsApp} className={styles.shareOptionButton}> <FaWhatsapp className={styles.shareIcon} /> WhatsApp </button>
                            <button onClick={() => setShowShareOptions(false)} className={`${styles.shareOptionButton} ${styles.closeShareButton}`} title="Close share options" > <FaTimes /> </button>
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
            </div> {/* End Actions Bar */}

            {/* Display local error (for favorite/delete errors) */}
            {localError && <span className={styles.actionError}>{localError}</span>}

            {/* Conditionally Render Comment Input Form */}
            {showCommentInput && (
                <div className={styles.commentInputSection}> {/* Add CSS for this class */}
                    <AddCommentForm
                        connectionId={connectionId}
                        onCommentAdded={handleCommentAdded} // Pass the handler
                    />
                    {/* AddCommentForm should handle its own errors internally */}
                </div>
            )}

        </div> // End Card
    );
};

export default TextConnectionCard;
