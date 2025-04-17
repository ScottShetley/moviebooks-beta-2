// client/src/components/Comment/CommentList.js
import React from 'react';

// Import the component used to render each individual comment
import CommentItem from './CommentItem';

// Import component-specific styles
import styles from './CommentList.module.css';

/**
 * Renders a list of comments.
 * Takes an array of comment objects as a prop and displays them using CommentItem.
 * Shows a message if there are no comments.
 */
const CommentList = ({ comments }) => {
    // --- Check for Comments ---
    // Determine if the 'comments' prop is a valid array and contains at least one comment.
    // This is used for conditional rendering below.
    const hasComments = Array.isArray(comments) && comments.length > 0;

    // --- Render Logic ---
    return (
        // Container div for the entire comment list section
        <div className={styles.commentListContainer}>
            {/* Title for the comment section */}
            <h4 className={styles.listTitle}>Comments</h4>

            {/* Conditional Rendering: Show list or 'no comments' message */}
            {hasComments ? (
                // If there are comments, render an unordered list (<ul>)
                <ul className={styles.commentList}>
                    {/* Map over the 'comments' array */}
                    {comments.map((comment) => (
                        // For each 'comment' object in the array, render a CommentItem component.
                        // Pass the individual 'comment' object as a prop to CommentItem.
                        // Use 'comment._id' as the unique 'key' prop, which React requires for list rendering efficiency.
                        <CommentItem key={comment._id} comment={comment} />
                    ))}
                </ul>
            ) : (
                // If 'hasComments' is false, render a paragraph with a message.
                <p className={styles.noCommentsMessage}>No comments yet. Be the first!</p>
            )}
        </div>
    );
};

export default CommentList;
