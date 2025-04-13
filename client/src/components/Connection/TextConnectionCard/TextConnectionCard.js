// client/src/components/Connection/TextConnectionCard/TextConnectionCard.js
import React, { useState, useCallback } from 'react'; // Added useState, useCallback
import { Link, useNavigate } from 'react-router-dom';
import { FaRegCommentAlt, FaShareAlt, FaTrashAlt } from 'react-icons/fa'; // Added FaTrashAlt
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext'; // Added useAuth
import api, { getStaticFileUrl } from '../../../services/api'; // Added api
import LikeButton from '../../Common/LikeButton/LikeButton';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner'; // Added LoadingSpinner
import defaultAvatar from '../../../assets/images/default-avatar.png';
import styles from './TextConnectionCard.module.css'; // Ensure styles for delete are added/present

// Import the Share Pop-up if it's reusable, otherwise implement basic share here
// import SharePopup from '../../Common/SharePopup/SharePopup'; // Example if extracted


// *** ADD onDelete prop ***
const TextConnectionCard = ({ connection, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const { user, updateUserFavorites } = useAuth(); // Get user and updateUserFavorites (for cleanup)

  // --- Add State for Delete ---
  const [isDeleting, setIsDeleting] = useState(false);
  const [localError, setLocalError] = useState(null); // Error state for delete/share actions

  // Basic check for required data
  if (!connection || !connection.userRef || !connection._id) {
    console.warn('TextConnectionCard received incomplete connection data:', connection);
    return null;
  }

  const {
    _id: connectionId,
    userRef,
    context,
    createdAt,
    likes = [],
  } = connection;

  // --- Check if current user is owner ---
  const isOwner = !!user && user._id === userRef._id;

  // Format timestamp
  const timeAgo = formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true });

  // Determine avatar URL
  const avatarUrl = userRef.profileImageUrl
    ? getStaticFileUrl(userRef.profileImageUrl)
    : defaultAvatar;

  // Determine display name
  const displayName = userRef.displayName || userRef.username || 'User';

  // --- Action Handlers ---
  const handleCommentClick = () => {
    navigate(`/connections/${connectionId}`);
  };

  const handleShareClick = () => {
    const url = `${window.location.origin}/connections/${connectionId}`;
    navigator.clipboard.writeText(url)
      .then(() => { alert('Link copied to clipboard!'); }) // TODO: Better feedback
      .catch(err => { console.error('Failed to copy link: ', err); alert('Failed to copy link.'); });
  };

  // --- Add Delete Handler (adapted from ConnectionCard) ---
  const handleDelete = async () => {
        const currentConnectionId = connectionId; // Use connectionId directly
        // --- DEBUG START ---
        console.log('[TextCard handleDelete] Clicked. isOwner:', isOwner, 'isDeleting:', isDeleting, 'ID:', currentConnectionId);
        if (!isOwner || isDeleting || !currentConnectionId) {
            console.log('[TextCard handleDelete] Aborting - Pre-condition failed.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this post?')) {
             console.log('[TextCard handleDelete] Aborting - User cancelled confirm dialog.');
             return;
        }
        // --- DEBUG END ---

        setIsDeleting(true);
        setLocalError(null);

        try {
            console.log('[TextCard handleDelete] Sending DELETE request for ID:', currentConnectionId);
            await api.delete(`/connections/${currentConnectionId}`);
            console.log('[TextCard handleDelete] API call successful.');

            // Handle User Favorites Update (if user might favorite text posts)
            if (user?.favorites?.includes(currentConnectionId)) {
                if (typeof updateUserFavorites === 'function') {
                    updateUserFavorites(currentConnectionId);
                 } else {
                     console.warn("updateUserFavorites function not available from AuthContext for delete cleanup");
                 }
            }

            // Call parent handler to remove from list
            if (onDelete) {
                console.log('[TextCard handleDelete] Calling parent onDelete prop.');
                onDelete(currentConnectionId);
            } else {
                console.warn('[TextCard handleDelete] onDelete prop is missing!');
            }
            // Don't reset isDeleting on success, component should unmount
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete post.";
            console.error(`[TextCard handleDelete - ${currentConnectionId}] Error:`, err);
            setLocalError(msg);
            setIsDeleting(false); // Reset loading state ONLY on error
        }
    };
  // --- END Delete Handler ---


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
      {context && ( <div className={styles.context} onClick={handleCommentClick} style={{cursor: 'pointer'}} title="View connection details"><p>{context}</p></div> )}

      {/* Action Bar */}
      <div className={styles.actions}>
         <LikeButton connectionId={connectionId} initialLikes={likes} onLikeUpdate={onUpdate} />
         <button onClick={handleCommentClick} className={styles.actionButton} title="Comment"><FaRegCommentAlt /></button>
         <button onClick={handleShareClick} className={styles.actionButton} title="Share"><FaShareAlt /></button>

         {/* --- Add Delete Button (Conditionally Rendered) --- */}
         {isOwner && (
            <button
                className={`${styles.actionButton} ${styles.deleteButton}`} // Ensure .deleteButton style exists in CSS
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete Post"
                aria-label="Delete this post"
            >
                {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />}
            </button>
         )}
         {/* Display local error if needed */}
         {/* {localError && <span className={styles.actionError}>{localError}</span>} */}
      </div>
    </div>
  );
};

export default TextConnectionCard;