// client/src/components/comments/CommentItem/CommentItem.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// --- NEW: Import updateComment and deleteComment API functions ---
import { getStaticFileUrl, updateComment, deleteComment } from '../../../services/api';
// --- END NEW IMPORT ---
import { useAuth } from '../../../contexts/AuthContext';
import { FaUserCircle, FaEdit, FaTrashAlt, FaSave, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import styles from './CommentItem.module.css';


// This component will display a single comment
// --- Using onCommentUpdated and onCommentDeleted props now ---
const CommentItem = ({ comment, onCommentUpdated, onCommentDeleted }) => {
    // Get the current user from AuthContext (MUST be at the top)
    const { user } = useAuth();

    // State for editing functionality (MUST be at the top)
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.text);
    const [isSubmitting, setIsSubmitting] = useState(false); // Will use this now
    const [error, setError] = useState(null); // Will use this now


    // Ensure the comment and its user reference exist (Check happens AFTER Hooks)
    if (!comment || !comment.user) {
        console.error("CommentItem: Received null or incomplete comment data", comment);
        // Now that Hooks are called above, this early return is safe
        return <div className={styles.commentItem}>Error displaying comment.</div>;
    }


    // Use the user's display name if available, otherwise fallback to username, then 'Anonymous'
    const displayUsername = comment.user.displayName || comment.user.username || 'Anonymous';

    // --- MODIFIED: Get the avatar URL using the CORRECT field name profilePictureUrl ---
    const avatarUrl = comment.user.profilePictureUrl ? getStaticFileUrl(comment.user.profilePictureUrl) : null;
    // --- END MODIFIED ---

    // Determine if the logged-in user is the author of THIS comment
    const isAuthor = user && comment.user && user._id === comment.user._id;


    // --- MODIFIED: Handlers with API calls and state updates ---
    const handleEditClick = () => {
        setIsEditing(true);
        setEditedText(comment.text); // Reset editedText to the *current* comment text
        setError(null); // Clear any previous errors
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedText(comment.text); // Revert changes on cancel
        setError(null); // Clear any previous errors
    };

    const handleSaveClick = async () => {
        setError(null); // Clear previous errors on new attempt
        setIsSubmitting(true); // Start submitting state

        // Basic validation
        if (!editedText.trim()) {
            setError('Comment text cannot be empty.');
            setIsSubmitting(false);
            return;
        }

        // Check if text has actually changed
        if (editedText.trim() === comment.text.trim()) {
            setIsEditing(false); // Just close the form if no change
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the backend API to update the comment
            // Use the comment._id and the editedText
            const response = await updateComment(comment._id, editedText.trim());
            console.log('[CommentItem] Comment updated successfully:', response.data);

            // Update the comment data in the parent state
            if (onCommentUpdated) {
                onCommentUpdated(response.data); // Pass the updated comment object from the backend
            }

            setIsEditing(false); // Exit edit mode
            // Note: The comment text displayed will automatically update because the parent
            // component (ConnectionDetailPage) will update its comments state,
            // passing the new 'comment' prop to this component.

        } catch (err) {
            console.error('[CommentItem] Error updating comment:', err);
            const message = err.response?.data?.message || err.message || 'Failed to update comment.';
            setError(message);
        } finally {
            setIsSubmitting(false); // End submitting state
        }
    };

    const handleDeleteClick = async () => {
        // Confirm with the user
        if (!window.confirm('Are you sure you want to delete this comment?')) {
             console.log('[CommentItem] Delete cancelled by user.');
             return; // Stop if user cancels
        }

        setError(null); // Clear previous errors on new attempt
        setIsSubmitting(true); // Start submitting state

        try {
            // Call the backend API to delete the comment
            // Use the comment._id
            await deleteComment(comment._id);
            console.log(`[CommentItem] Comment ${comment._id} deleted successfully.`);

            // Notify the parent component to remove this comment from its list
            if (onCommentDeleted) {
                onCommentDeleted(comment._id); // Pass the ID of the deleted comment
            }
            // Note: This component will be unmounted because the parent
            // component will remove the comment from its state.

        } catch (err) {
            console.error('[CommentItem] Error deleting comment:', err);
            const message = err.response?.data?.message || err.message || 'Failed to delete comment.';
            setError(message);
        } finally {
            setIsSubmitting(false); // End submitting state
        }
    };
    // --- END MODIFIED HANDLERS ---


    return (
        <div className={styles.commentItem}>
            {/* Avatar Section */}
            <div className={styles.avatarContainer}>
                 {/* --- MODIFIED: Use avatarUrl variable which now uses profilePictureUrl --- */}
                 {avatarUrl ? (
                    <img src={avatarUrl} alt={`${displayUsername}'s avatar`} className={styles.avatar} />
                 ) : (
                    // Use a default icon if no avatar is available
                    <FaUserCircle size={40} color="var(--color-text-light)" /> // Adjust size/color as needed
                 )}
                 {/* --- END MODIFIED --- */}
            </div>

            {/* Comment Content Section */}
            <div className={styles.commentContent}>
                <div className={styles.commentMeta}>
                    {/* Link to the comment author's profile */}
                    <strong>
                        {/* Ensure comment.user exists before accessing _id for the link */}
                        {comment.user?._id ? (
                             <Link to={`/users/${comment.user._id}`} className={styles.authorLink}>
                                 {displayUsername}
                             </Link>
                        ) : (
                             // Render just the username if user ID is somehow missing (shouldn't happen with populate)
                             <span>{displayUsername}</span>
                        )}
                    </strong>
                    {' on '}
                    {/* Display formatted date/time */}
                    <span className={styles.timestamp}>
                        {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {/* --- Display Edit/Delete buttons if user is author and NOT editing --- */}
                    {isAuthor && !isEditing && (
                        <div className={styles.actions}> {/* Add a container for action buttons */}
                            <button onClick={handleEditClick} className={styles.actionButton} title="Edit comment">
                                <FaEdit />
                            </button>
                            <button onClick={handleDeleteClick} className={styles.actionButton} title="Delete comment" disabled={isSubmitting}> {/* Disable delete button while submitting */}
                                {isSubmitting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} {/* Show spinner on delete */}
                            </button>
                        </div>
                    )}
                    {/* --- END BUTTONS --- */}
                </div>

                {/* --- Conditionally render text or edit form --- */}
                {isEditing ? (
                    // Render Edit Form
                    <div className={styles.editForm}>
                        <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows="3"
                            disabled={isSubmitting} // Disable textarea while submitting
                        />
                        {/* Display error within the item */}
                        {error && <div className={styles.error}>{error}</div>}
                        <div className={styles.editActions}>
                            <button
                                onClick={handleSaveClick}
                                disabled={isSubmitting || editedText.trim() === comment.text.trim() || editedText.trim() === ''} // Disable if submitting, no change, or empty
                                className={`${styles.actionButton} ${styles.saveButton}`}
                            >
                                {isSubmitting ? <LoadingSpinner size="small" inline /> : <FaSave />} Save
                            </button>
                            <button
                                onClick={handleCancelClick}
                                disabled={isSubmitting} // Disable cancel button while submitting
                                className={`${styles.actionButton} ${styles.cancelButton}`}
                            >
                                <FaTimes /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    // Render Comment Text
                     <p className={styles.commentText}>{comment.text}</p>
                )}
                {/* --- Display error outside edit mode too if needed (optional, but good for delete) --- */}
                {!isEditing && error && <div className={styles.error}>{error}</div>}

            </div>
        </div>
    );
};

export default CommentItem;