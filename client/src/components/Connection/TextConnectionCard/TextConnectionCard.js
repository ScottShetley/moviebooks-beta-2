// client/src/components/Connection/TextConnectionCard/TextConnectionCard.js
import React, { useState, useCallback, useRef, useEffect } from 'react'; // All hooks imported
import { Link, useNavigate } from 'react-router-dom';
import {
    FaRegCommentAlt, FaShareAlt, FaTrashAlt, FaTwitter, FaFacebook,
    FaLink, FaTimes, FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp
} from 'react-icons/fa';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import api, { getStaticFileUrl } from '../../../services/api';
import LikeButton from '../../Common/LikeButton/LikeButton';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import defaultAvatar from '../../../assets/images/default-avatar.png';
import styles from './TextConnectionCard.module.css';

const TextConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // --- MOVE ALL HOOK CALLS TO THE TOP ---
    const navigate = useNavigate();
    const { user, updateUserFavorites } = useAuth();

    // State for Delete
    const [isDeleting, setIsDeleting] = useState(false);
    const [localError, setLocalError] = useState(null);

    // State and Refs for Share Popup
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
    // --- END HOOK CALLS ---


    // Basic check for required data - NOW SAFE TO DO AFTER HOOKS
    if (!connection || !connection.userRef || !connection._id) {
        console.warn('TextConnectionCard received incomplete connection data:', connection);
        return null; // Early return is okay here
    }

    // Destructure connection data (safe after the check)
    const {
        _id: connectionId,
        userRef,
        context,
        createdAt,
        likes = [],
    } = connection;

    // Derived values (safe after check)
    const isOwner = !!user && user._id === userRef._id;
    const timeAgo = formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true });
    const avatarUrl = userRef.profileImageUrl
        ? getStaticFileUrl(userRef.profileImageUrl)
        : defaultAvatar;
    const displayName = userRef.displayName || userRef.username || 'User';

    // Action Handlers
    const handleCommentClick = () => {
        navigate(`/connections/${connectionId}`);
    };

    // SHARE ACTION HANDLERS (Adapted for Text Card & Connection URL)
    const connectionUrl = `${window.location.origin}/connections/${connectionId}`;
    const shareText = `Check out this connection on MovieBooks: ${connection.context?.substring(0, 50) || ''}...`;

    const handleShareToggle = () => { setShowShareOptions(prev => !prev); setCopyStatus('Copy Link'); };
    const handleCopyToClipboard = async () => { try { await navigator.clipboard.writeText(connectionUrl); setCopyStatus('Copied!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } catch (err) { console.error('Failed to copy link: ', err); setCopyStatus('Failed!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } };
    const handleShareToX = () => { const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(connectionUrl)}&text=${encodeURIComponent(shareText)}`; window.open(xUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToFacebook = () => { const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(connectionUrl)}`; window.open(facebookUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToLinkedIn = () => { const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(connectionUrl)}`; window.open(linkedInUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToReddit = () => { const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(connectionUrl)}&title=${encodeURIComponent('MovieBooks Connection')}`; window.open(redditUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToPinterest = () => { const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(connectionUrl)}&media=${encodeURIComponent(window.location.origin + '/MovieBooks-logo.jpg')}&description=${encodeURIComponent(shareText)}`; window.open(pinterestUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToWhatsApp = () => { const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + connectionUrl)}`; window.open(whatsappUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };

    // Delete Handler
    const handleDelete = async () => {
        const currentConnectionId = connectionId;
        console.log('[TextCard handleDelete] Clicked. isOwner:', isOwner, 'isDeleting:', isDeleting, 'ID:', currentConnectionId);
        if (!isOwner || isDeleting || !currentConnectionId) { console.log('[TextCard handleDelete] Aborting - Pre-condition failed.'); return; }
        if (!window.confirm('Are you sure you want to delete this post?')) { console.log('[TextCard handleDelete] Aborting - User cancelled confirm dialog.'); return; }
        setIsDeleting(true); setLocalError(null);
        try {
            console.log('[TextCard handleDelete] Sending DELETE request for ID:', currentConnectionId);
            await api.delete(`/connections/${currentConnectionId}`);
            console.log('[TextCard handleDelete] API call successful.');
            if (user?.favorites?.includes(currentConnectionId)) { if (typeof updateUserFavorites === 'function') { updateUserFavorites(currentConnectionId); } else { console.warn("updateUserFavorites function not available from AuthContext for delete cleanup"); } }
            if (onDelete) { console.log('[TextCard handleDelete] Calling parent onDelete prop.'); onDelete(currentConnectionId); } else { console.warn('[TextCard handleDelete] onDelete prop is missing!'); }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete post.";
            console.error(`[TextCard handleDelete - ${currentConnectionId}] Error:`, err); setLocalError(msg); setIsDeleting(false);
        }
    };

    return (
        <div className={styles.card}>
            {/* User Info Header */}
            <div className={styles.userInfo}>
                <Link to={`/users/${userRef._id}`} className={styles.avatarLink}>
                    <img src={avatarUrl} alt={`${displayName}'s avatar`} className={styles.avatar} onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
                </Link>
                <div className={styles.nameTime}>
                    <Link to={`/users/${userRef._id}`} className={styles.nameLink}>{displayName}</Link>
                    <Link to={`/connections/${connectionId}`} className={styles.timestampLink}><span className={styles.timestamp}>{timeAgo}</span></Link>
                </div>
            </div>

            {/* Connection Context */}
            {context && (<div className={styles.context} onClick={handleCommentClick} style={{ cursor: 'pointer' }} title="View connection details"><p>{context}</p></div>)}

            {/* Action Bar */}
            <div className={styles.actions}>
                <LikeButton connectionId={connectionId} initialLikes={likes} onLikeUpdate={onUpdate} />
                <button onClick={handleCommentClick} className={styles.actionButton} title="Comment"><FaRegCommentAlt /></button>

                {/* SHARE BUTTON & POPUP STRUCTURE */}
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
                        <div
                            ref={shareOptionsRef}
                            id={`share-options-${connectionId}`}
                            className={styles.shareOptionsPopup}
                            role="menu"
                        >
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
                {/* END SHARE STRUCTURE */}


                {/* Delete Button */}
                {isOwner && (
                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Delete Post"
                        aria-label="Delete this post"
                    >
                        {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />}
                    </button>
                )}
                {/* Display local error */}
                {localError && <span className={styles.actionError}>{localError}</span>}
            </div>
        </div>
    );
};

export default TextConnectionCard;