// client/src/components/Comment/CommentList.js
import React from 'react';
import CommentItem from './CommentItem'; // Import the CommentItem component
import styles from './CommentList.module.css';

const CommentList = ({ comments }) => {
    // Check if comments array is provided and has items
    const hasComments = Array.isArray(comments) && comments.length > 0;

    return (
        <div className={styles.commentListContainer}>
            <h4 className={styles.listTitle}>Comments</h4>
            {hasComments ? (
                <ul className={styles.commentList}>
                    {comments.map((comment) => (
                        // Use comment._id as the key for React list rendering
                        <CommentItem key={comment._id} comment={comment} />
                    ))}
                </ul>
            ) : (
                <p className={styles.noCommentsMessage}>No comments yet. Be the first!</p>
            )}
        </div>
    );
};

export default CommentList;