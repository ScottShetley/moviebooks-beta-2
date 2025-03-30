// client/src/components/Comment/AddCommentForm.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // To check if user is logged in
import { createComment } from '../../services/api'; // API function
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner'; // Re-use spinner
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage'; // Re-use error display
import styles from './AddCommentForm.module.css';


const AddCommentForm = ({ connectionId, onCommentAdded }) => {
    const { user } = useAuth(); // Get current user state
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Don't render the form at all if the user is not logged in
    if (!user) {
        return null; // Or optionally: <p>Please log in to comment.</p>
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!commentText.trim() || isSubmitting) {
            return; // Do nothing if text is empty or already submitting
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Call the API function to create the comment
            const response = await createComment(connectionId, { text: commentText.trim() });
            const newComment = response.data; // The backend returns the newly created comment populated with user

            // Call the callback prop to notify the parent (ConnectionCard)
            if (onCommentAdded) {
                onCommentAdded(newComment);
            }

            // Reset the form
            setCommentText('');

        } catch (err) {
            console.error("Error submitting comment:", err);
            const message = err.response?.data?.message || err.message || "Failed to post comment.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.commentForm} onSubmit={handleSubmit}>
            <textarea
                className={styles.commentInput}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                rows={3} // Start with 3 rows, adjust as needed
                required
                disabled={isSubmitting}
                maxLength={1000} // Match backend validation
            />
            <div className={styles.formActions}>
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!commentText.trim() || isSubmitting}
                >
                    {isSubmitting ? <LoadingSpinner size="small" inline /> : 'Post Comment'}
                </button>
                {/* Optional: Display character count */}
                {/* <span className={styles.charCount}>{commentText.length}/1000</span> */}
            </div>
            {error && <ErrorMessage message={error} />}
        </form>
    );
};

export default AddCommentForm;