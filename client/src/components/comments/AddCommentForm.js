// client/src/components/comments/AddCommentForm.js
import React, { useState } from 'react';

// Import custom hook to check user authentication status
import { useAuth } from '../../contexts/AuthContext';

// Import the specific API function for creating comments
import { createComment } from '../../services/api';

// Import reusable UI components
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';

// Import component-specific styles
import styles from './AddCommentForm.module.css';

/**
 * A form component allowing logged-in users to add comments to a specific connection.
 * It handles input state, submission logic, loading/error states, and notifies
 * the parent component when a comment is successfully added.
 */
const AddCommentForm = ({ connectionId, onCommentAdded }) => {
    // --- Hooks ---
    // Get the current user object from the authentication context
    const { user } = useAuth();

    // --- State Variables ---
    // Store the text content of the comment being typed
    const [commentText, setCommentText] = useState('');
    // Track whether the form is currently submitting to the API
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Store any error messages that occur during submission
    const [error, setError] = useState(null);

    // --- Conditional Rendering ---
    // If the user is not logged in, don't render the form at all.
    // Alternatively, you could show a message like: <p>Please log in to comment.</p>
    if (!user) {
        return null;
    }

    // --- Event Handlers ---

    /**
     * Handles the submission of the comment form.
     * Validates input, calls the API, handles success/error states,
     * and calls the onCommentAdded callback.
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        // Prevent the default browser behavior of reloading the page on form submit
        e.preventDefault();

        // Basic validation: Do nothing if the comment text is empty (after trimming whitespace)
        // or if the form is already in the process of submitting.
        if (!commentText.trim() || isSubmitting) {
            return;
        }

        // Set loading state and clear previous errors
        setIsSubmitting(true);
        setError(null);

        try {
            // Call the imported API function, passing the connection ID and the comment text.
            // Ensure text is trimmed before sending.
            const response = await createComment(connectionId, { text: commentText.trim() });

            // Assuming the backend returns the newly created comment object (populated with user info)
            const newComment = response.data;

            // If a callback function was provided via props, call it with the new comment data.
            // This allows the parent component (e.g., ConnectionCard, ConnectionDetails) to update its state.
            if (onCommentAdded) {
                onCommentAdded(newComment);
            }

            // Clear the textarea input field after successful submission
            setCommentText('');

        } catch (err) {
            // Log the error for debugging purposes (optional for production)
            // console.error("Error submitting comment:", err);

            // Extract a user-friendly error message from the API response or use a generic fallback.
            const message = err.response?.data?.message || err.message || "Failed to post comment.";
            setError(message); // Update the error state to display the message
        } finally {
            // Ensure the loading state is turned off regardless of success or failure.
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    return (
        // Use the 'form' element and attach the handleSubmit handler
        <form className={styles.commentForm} onSubmit={handleSubmit}>
            {/* Textarea for comment input */}
            <textarea
                className={styles.commentInput}
                value={commentText} // Bind value to state
                onChange={(e) => setCommentText(e.target.value)} // Update state on change
                placeholder="Add your comment..." // Placeholder text
                rows={3} // Initial height (can often grow automatically with CSS)
                required // HTML5 validation: field must not be empty
                disabled={isSubmitting} // Disable input while submitting
                maxLength={1000} // HTML5 validation: limit input length (should match backend)
            />
            {/* Container for action buttons and potentially other info (like char count) */}
            <div className={styles.formActions}>
                {/* Submit Button */}
                <button
                    type="submit" // Standard submit button
                    className={styles.submitButton}
                    // Disable if text is empty or currently submitting
                    disabled={!commentText.trim() || isSubmitting}
                >
                    {/* Show spinner or text based on submission state */}
                    {isSubmitting ? <LoadingSpinner size="small" inline /> : 'Post Comment'}
                </button>
                {/* Optional: Display character count - uncomment if desired */}
                {/* <span className={styles.charCount}>{commentText.length}/1000</span> */}
            </div>
            {/* Display any submission errors */}
            {error && <ErrorMessage message={error} />}
        </form>
    );
};

export default AddCommentForm;
