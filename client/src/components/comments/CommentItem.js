// client/src/components/Comment/CommentItem.js
import React from 'react';
import { Link } from 'react-router-dom'; // Used for linking to the user's profile

// Import component-specific styles
import styles from './CommentItem.module.css';

/**
 * Renders a single comment item, including the commenter's username,
 * the comment text, and the timestamp.
 */
const CommentItem = ({ comment }) => {
    // --- Input Validation ---
    // Basic check to ensure the essential parts of the comment object are present.
    // This prevents errors if incomplete data is somehow passed down.
    if (!comment || !comment.user || !comment.user.username || !comment.text || !comment.createdAt) {
        // Log an error to the console for developers to see during development/debugging.
        // In a production environment, you might replace this with a more robust error reporting mechanism
        // or simply render a generic error message without logging to the console.
        console.error("CommentItem received incomplete data:", comment);
        // Render a fallback UI indicating an error occurred with this specific comment.
        return <li className={styles.commentItem}>Error: Invalid comment data.</li>;
    }

    // --- Data Destructuring ---
    // Extract user, text, and createdAt from the comment object for easier use below.
    const { user, text, createdAt } = comment;

    // --- Date Formatting ---
    // Convert the ISO date string (createdAt) into a more readable format.
    // .toLocaleString() uses the user's local settings for date and time format.
    // Consider using a library like `date-fns` (e.g., `formatDistanceToNowStrict`)
    // if you want relative timestamps ("2 hours ago") or more consistent formatting across users.
    const formattedTimestamp = new Date(createdAt).toLocaleString();

    // --- Render Logic ---
    return (
        // Use a list item element as this component is likely rendered within a <ul> in CommentList
        <li className={styles.commentItem}>
            {/* Header section containing username and timestamp */}
            <div className={styles.commentHeader}>
                {/* Link to the commenter's profile page */}
                <Link to={`/users/${user._id}`} className={styles.username}>
                    {user.username}
                </Link>
                {/* Display the formatted timestamp */}
                <span className={styles.timestamp}>
                    {formattedTimestamp}
                </span>
            </div>
            {/* Display the main text content of the comment */}
            {/* Using <p> ensures block display and semantic correctness */}
            <p className={styles.commentText}>{text}</p>
        </li>
    );
};

export default CommentItem;
